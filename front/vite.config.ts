import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    // allowedHosts держим в env (.env.*.local — в .gitignore), а не хардкодом:
    // demo/туннельные домены у каждого разработчика свои, общий конфиг ими не засоряем.
    const env = loadEnv(mode, __dirname, "VITE_");
    const allowedHosts = (env.VITE_ALLOWED_HOSTS ?? "")
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean);

    return {
        plugins: [react()],

        server: {
            port: 3002,
            ...(allowedHosts.length > 0 ? { allowedHosts } : {}),
        },

        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
        css: {
            preprocessorOptions: {
                scss: {
                    additionalData: `@use "@/styles/index" as *;`,
                },
            },
        },
        build: {
            outDir: "build",
        },
    };
});
