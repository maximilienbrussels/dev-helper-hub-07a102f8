/**
 * Belgische gestructureerde mededeling (+++xxx/xxxx/xxxxx+++).
 * De laatste twee cijfers zijn de modulo-97-controle; 0 wordt 97.
 */
export function structuredCommunication(prefix: number, nummer: number): string {
  const raw = `${String(prefix % 1000).padStart(3, "0")}${String(nummer % 10_000_000).padStart(7, "0")}`;
  const mod = Number(BigInt(raw) % 97n);
  const check = String(mod === 0 ? 97 : mod).padStart(2, "0");
  const full = raw + check;
  return `+++${full.slice(0, 3)}/${full.slice(3, 7)}/${full.slice(7)}+++`;
}
