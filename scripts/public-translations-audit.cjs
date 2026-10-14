/** Candidate inventory only: not a substitute for rendered-page and Academy audits. */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const localeArg = args.find((arg) => arg.startsWith('--locale='));
const locale = localeArg ? localeArg.slice('--locale='.length) : 'de';
const plannedLocales = ['de', 'ar', 'tr', 'es', 'it', 'pt', 'pl', 'ro', 'zgh'];
if (!plannedLocales.includes(locale)) throw new Error(`Unknown supplemental locale: ${locale}`);
const output = args.find((arg) => !arg.startsWith('--'));
const entries = new Map();
const dictionaryKeys = new Set();
const extraFiles = fs.readdirSync(path.join(root, 'src/lib/i18n-extra'))
  .filter((file) => (file === `${locale}.ts` || file.startsWith(`${locale}-`)) && /\.ts$/.test(file));
const germanKeys = new Set();
const germanPhrases = new Set();
const keyName = (node, source) => ts.isIdentifier(node) || ts.isStringLiteralLike(node)
  ? node.text : node.getText(source);

function parse(file, visit) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  function walk(node) { visit(node, source); ts.forEachChild(node, walk); }
  walk(source);
}

for (const file of extraFiles) {
  const target = file === `${locale}.ts` ? germanKeys : germanPhrases;
  parse(path.join(root, 'src/lib/i18n-extra', file), (node, source) => {
    if (ts.isPropertyAssignment(node) && ts.isStringLiteralLike(node.initializer))
      target.add(keyName(node.name, source));
  });
}

function inventory(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['portal', 'test', 'ui', 'i18n-extra', 'portal-i18n'].includes(entry.name)) inventory(file);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(file) || /\.(server|functions|test|spec)\./.test(file) || file.endsWith('.gen.ts')) continue;
    parse(file, (node, source) => {
      if (ts.isCallExpression(node) && node.expression.getText(source) === 't' && node.arguments[0] && ts.isStringLiteralLike(node.arguments[0]))
        dictionaryKeys.add(node.arguments[0].text);
      if (!ts.isPropertyAssignment(node) || keyName(node.name, source) !== 'en') return;
      function collect(child) {
        if (ts.isStringLiteralLike(child) && child.text.trim() && !/^https?:|^\//.test(child.text)) {
          const refs = entries.get(child.text) ?? new Set();
          const line = source.getLineAndCharacterOfPosition(child.getStart(source)).line + 1;
          refs.add(`${path.relative(root, file)}:${line}`);
          entries.set(child.text, refs);
        }
        ts.forEachChild(child, collect);
      }
      collect(node.initializer);
    });
  }
}
inventory(path.join(root, 'src'));
const candidates = [...entries].map(([text, refs]) => ({ text, sources: [...refs], germanPhrasePresent: germanPhrases.has(text) }));
const report = {
  locale,
  warning: 'Candidate inventory includes metadata and dictionary values. Presence does not prove wiring or completeness. Dynamic strings, raw JSX, downloads and live Academy content need separate review.',
  totalEnglishCandidates: candidates.length,
  germanPhraseCandidatesMissing: candidates.filter((entry) => !entry.germanPhrasePresent).length,
  germanPublicKeysMissing: [...dictionaryKeys].filter((key) => !germanKeys.has(key)).sort(),
  phraseCandidatesMissing: candidates.filter((entry) => !entry.germanPhrasePresent).length,
  publicKeysMissing: [...dictionaryKeys].filter((key) => !germanKeys.has(key)).sort(),
  candidates,
};
if (output) fs.writeFileSync(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ locale, totalEnglishCandidates: report.totalEnglishCandidates, phraseCandidatesMissing: report.phraseCandidatesMissing, publicKeysMissing: report.publicKeysMissing }, null, 2));