import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { App } from "./App";
import "./index.css";

const deploymentUrl = import.meta.env.VITE_CONVEX_URL;

if (!deploymentUrl) {
  throw new Error("VITE_CONVEX_URL is missing. Run `npx convex dev` to configure the app.");
}

const convex = new ConvexReactClient(deploymentUrl);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </StrictMode>,
);
