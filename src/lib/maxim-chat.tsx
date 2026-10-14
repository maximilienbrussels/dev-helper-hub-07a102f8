import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

/**
 * Globale besturing van de Maxim-chat.
 *
 * De chat zelf wordt één keer gemonteerd in de publieke shell, zodat hij bij
 * navigatie nooit unmount (en dus geschiedenis, positie en open-status behoudt).
 * Pagina's die de chat in dierenmodus willen zetten, gebruiken `useMaximAnimal`.
 */

export type MaximAnimal = { id: number; name: string } | null;

type MaximChatControl = {
  animal: MaximAnimal;
  setAnimal: (animal: MaximAnimal) => void;
  /** Teller: elke verhoging vraagt het chatvenster te openen. */
  openRequest: number;
  /** Vraag die bij het openen automatisch verstuurd wordt (bv. weerbadge). */
  openPrompt: string | null;
  /** Foto (data-URL) die samen met de vraag verstuurd wordt (QR-wandelroute). */
  openImage: string | null;
  requestOpen: (prompt?: string, image?: string) => void;
};

const MaximChatContext = createContext<MaximChatControl | null>(null);

export function MaximChatProvider({ children }: { children: ReactNode }) {
  const [animal, setAnimalState] = useState<MaximAnimal>(null);
  const [openRequest, setOpenRequest] = useState(0);
  const [openPrompt, setOpenPrompt] = useState<string | null>(null);
  const [openImage, setOpenImage] = useState<string | null>(null);

  const setAnimal = useCallback((next: MaximAnimal) => {
    setAnimalState((prev) => {
      if (prev === next) return prev;
      if (prev && next && prev.id === next.id && prev.name === next.name) return prev;
      return next;
    });
  }, []);

  const requestOpen = useCallback((prompt?: string, image?: string) => {
    setOpenPrompt(prompt ?? null);
    setOpenImage(image ?? null);
    setOpenRequest((n) => n + 1);
  }, []);

  const value = useMemo<MaximChatControl>(
    () => ({ animal, setAnimal, openRequest, openPrompt, openImage, requestOpen }),
    [animal, setAnimal, openRequest, openPrompt, openImage, requestOpen],
  );

  return <MaximChatContext.Provider value={value}>{children}</MaximChatContext.Provider>;
}

export function useMaximChatControl(): MaximChatControl | null {
  return useContext(MaximChatContext);
}

/**
 * Zet de globale chat in de rol van één dier (QR-pagina's) en open hem eventueel.
 * Bij het verlaten van de pagina valt de chat terug op de gewone Maxim-gids.
 */
export function useMaximAnimal(animal: MaximAnimal, autoOpen = false) {
  const control = useMaximChatControl();
  const id = animal?.id;
  const name = animal?.name;

  useEffect(() => {
    if (!control) return;
    const next = typeof id === "number" && name ? { id, name } : null;
    control.setAnimal(next);
    if (next && autoOpen) control.requestOpen();
    return () => control.setAnimal(null);
    // control-functies zijn stabiel (useCallback), dus deze deps zijn volledig.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, name, autoOpen]);
}
