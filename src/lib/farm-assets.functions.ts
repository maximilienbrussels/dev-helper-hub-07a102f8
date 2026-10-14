/** Publieke serverfunctie: de fotokaarten zoals het team ze beheert. */
import { createServerFn } from "@tanstack/react-start";
import { FARM_ASSETS, type FarmAsset } from "@/config/farmAssets";

export const fetchFarmAssets = createServerFn({ method: "GET" }).handler(
  async (): Promise<Record<string, FarmAsset>> => {
    try {
      const { loadFarmAssets } = await import("./farm-assets.server");
      return await loadFarmAssets();
    } catch {
      return FARM_ASSETS;
    }
  },
);
