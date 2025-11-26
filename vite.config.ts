import { resolve } from "node:path";
import type { UserConfig } from "rolldown-vite";

export default {
    css: {
        // Use a more modern CSS transformer since we don't care about the minor incompatibilities.
        transformer: "lightningcss",
    },
    worker: {
        // Use modules in workers as they're supported by current browser versions.
        // (not utilized at the moment but we might split something to a worker)
        format: "es",
    },
    build: {
        rolldownOptions: {
            // Specify our multi page setup.
            input: {
                main: resolve(import.meta.dirname, "index.html"),
                management: resolve(import.meta.dirname, "management", "index.html"),
            },
        },
        modulePreload: {
            // No point in polyfilling when there's browser support in current versions.
            polyfill: false,
        },
        // Might as well expose the source for browser devtools clarity even in production.
        sourcemap: true,
    },
    server: {
        watch: {
            // Allow HMR
            usePolling: true,
            interval: 200,
        },
        host: true,
        port: 5173,
        /*allowedHosts: ["treasonous-improbably-bobby.ngrok-free.dev"],
        host: true,*/
        /*host: "0.0.0.0",
        port: 5173,*/
    },
} satisfies UserConfig;
