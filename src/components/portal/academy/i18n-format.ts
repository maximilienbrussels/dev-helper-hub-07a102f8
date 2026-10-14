/** Klein hulpmiddel om {placeholders} in vertaalde teksten te vervangen. */
export function fmt(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}
