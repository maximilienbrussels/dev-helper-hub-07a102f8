/** Gedeelde vorm voor de losse woordenboeken per portaalpagina. */
export type Entry = { fr: string; nl: string; en: string };
export type Dict = Record<string, Entry>;
