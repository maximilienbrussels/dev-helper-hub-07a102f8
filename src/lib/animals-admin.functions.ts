/**
 * Beheer van de bewoners (dieren): naam, soort, verhaaltje en profielfoto.
 *
 * De browser schrijft nooit rechtstreeks naar de databank: elke actie loopt
 * hier langs een rechtencontrole (`manage_media`) en validatie.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "@/lib/portal-permissions";

export type AdminAnimal = {
  id: number;
  name: string;
  species: string;
  description: string | null;
  image_url: string | null;
};

async function readAll(): Promise<AdminAnimal[]> {
  const { db, hasDatabase } = await import("@/lib/neon.server");
  if (!hasDatabase()) return [];
  try {
    const rows = (await db()`
      select id, name, species, description, image_url
        from animals
       order by name
    `) as unknown as AdminAnimal[];
    return rows.map((r) => ({ ...r, id: Number(r.id) }));
  } catch (error) {
    console.error("dieren lezen mislukt:", error);
    return [];
  }
}

/** Alle dieren voor het beheerportaal. */
export const listAnimalsAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<AdminAnimal[]> => {
    await requirePermission(context, "view_media");
    return readAll();
  });

const updateSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1, "Geef een naam op.").max(120),
  species: z.string().trim().min(1, "Geef een soort op.").max(120),
  description: z.string().trim().max(4000).default(""),
});

/** Naam, soort en verhaaltje van één dier aanpassen. */
export const updateAnimal = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data, context }): Promise<AdminAnimal[]> => {
    await requirePermission(context, "manage_media");
    const { db } = await import("@/lib/neon.server");
    await db()`
      update animals
         set name = ${data.name}, species = ${data.species},
             description = ${data.description || null}
       where id = ${data.id}
    `;
    return readAll();
  });

const imageSchema = z.object({
  id: z.number().int().positive(),
  imageUrl: z.string().trim().max(1000).nullable(),
});

/** Profielfoto van één dier instellen of wissen. */
export const setAnimalImage = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => imageSchema.parse(d))
  .handler(async ({ data, context }): Promise<AdminAnimal[]> => {
    await requirePermission(context, "manage_media");
    const { db } = await import("@/lib/neon.server");
    const url = data.imageUrl && data.imageUrl.length ? data.imageUrl : null;
    await db()`update animals set image_url = ${url} where id = ${data.id}`;
    return readAll();
  });
