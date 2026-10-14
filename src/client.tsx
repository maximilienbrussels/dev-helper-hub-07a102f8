import "reflect-metadata";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";

// Eigen client-entry (i.p.v. de default in node_modules): die .tsx werd door de
// preview-proxy soms niet geleverd, wat een wit scherm gaf
// ("Failed to fetch dynamically imported module .../default-entry/client.tsx").
startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
  );
});
