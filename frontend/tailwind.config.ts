import type { Config } from "tailwindcss";

const config: Config = {
    // Asegúrate de que las rutas apunten a donde tienes tus componentes
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}", // Por si usas la carpeta src
    ],
    darkMode: "class", // Permite el soporte para dark: que tienes en tu interfaz
    theme: {
        extend: {
            keyframes: {
                "infinite-loading": {
                    "0%": { left: "-33%" },
                    "100%": { left: "100%" },
                },
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                "zoom-in-95": {
                    "0%": { transform: "scale(0.95)", opacity: "0" },
                    "100%": { transform: "scale(1)", opacity: "1" },
                }
            },
            animation: {
                "infinite-loading": "infinite-loading 1.5s infinite linear",
                "fade-in": "fade-in 0.2s ease-out forwards",
                "zoom-in-95": "zoom-in-95 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
            },
        },
    },
    plugins: [],
};

export default config;