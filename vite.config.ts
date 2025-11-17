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
        // Listen on all addresses, not just localhost.
        host: true,
    },
    resolve: {
        // Consider defined import aliases in path resolution.
        tsconfigPaths: true,
    },
} satisfies UserConfig;
