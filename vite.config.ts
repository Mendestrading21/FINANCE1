import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ command }) => ({
  base: "./",
  plugins: [
    react(),
    ...(command === "build"
      ? [
          {
            name: "finance-csp",
            transformIndexHtml(html: string) {
              return html.replace(
                '<meta charset="UTF-8" />',
                `<meta charset="UTF-8" /><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'" />`,
              );
            },
          },
        ]
      : []),
  ],
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
}));
