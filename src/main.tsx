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
}
