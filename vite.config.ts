import { defineConfig } from "vite";
import postCssRemoveComments from "postcss-discard-comments";
import viteCompression from "vite-plugin-compression";
import { ViteMinifyPlugin } from "vite-plugin-minify";
import { VitePWA } from "vite-plugin-pwa";

const alphabet = "abcdefghijklmnopqrstuvwxyz".split(""),
    nameMap = new Map();
let counter = 0;
const nextName = (): string => {
    let name = "",
        n = counter++;
    do {
        name = alphabet[n % 26] + name;
        n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return name.toLowerCase();
};

const customScopedName = (localName: string, filename: string): string => {
    const key = `${filename}|${localName}`;
    if (!nameMap.has(key)) {
        nameMap.set(key, `${nextName()}${Array.from({ length: 2 }, () => Math.floor(Math.random() * 10)).join("")}`);
    }
    return nameMap.get(key)!;
};

export default defineConfig({
    plugins: [
        ViteMinifyPlugin({
            ignoreCustomComments: [],
        }),
        viteCompression(),
        VitePWA({
            registerType: "autoUpdate",
            manifest: {
                name: "kanamatsu",
                short_name: "kanamatsu",
                description: "a simple app to learn kana",
                theme_color: "#1d1b20",
                icons: [
                    {
                        src: "pwa-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                    {
                        src: "maskable-icon-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable",
                    },
                ],
            },
        }),
    ],
    css:
        process.env.NODE_ENV === "production"
            ? {
                  modules: {
                      generateScopedName: customScopedName,
                  },
                  postcss: {
                      plugins: [
                          postCssRemoveComments({
                              removeAll: true,
                          }),
                      ],
                  },
              }
            : {},
    build: {
        minify: "terser",
        cssCodeSplit: false,
        terserOptions: {
            parse: {
                html5_comments: false,
            },
            format: {
                comments: false,
            },
        },
    },
});
