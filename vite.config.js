import { defineConfig } from "rolldown-vite";

export default defineConfig({
    css: {
        transformer: "lightningcss",
    },
    worker: {
        format: "es",
    },
});
