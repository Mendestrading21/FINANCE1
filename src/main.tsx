import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Cache only the built application shell. Financial data never enters the service-worker cache.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(new URL("./sw.js", document.baseURI))
      .catch(() => {
        // Online use still works when the browser does not permit offline installation.
      });
  });
  // sw.js calls skipWaiting()/clients.claim() so a newly deployed shell activates without
  // waiting for every open tab to close first; this reloads the *already open* tab once so a
  // new page/feature (e.g. a page added after the user last opened the app) actually shows up,
  // instead of silently staying on the previous cached shell until the next manual reload.
  //
  // clients.claim() fires "controllerchange" the very first time a tab gets a controller too
  // (not only on a genuine later update) — reloading on that first event would just interrupt
  // a page that already has fresh content, right after it loaded. Only reload once a controller
  // was already present and then gets replaced by a newer one.
  let hadController = navigator.serviceWorker.controller !== null;
  let reloadedForUpdate = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController) {
      hadController = true;
      return;
    }
    if (reloadedForUpdate) return;
    reloadedForUpdate = true;
    window.location.reload();
  });
}
