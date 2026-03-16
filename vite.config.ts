import { defineConfig } from "vite";
import postCssRemoveComments from "postcss-discard-comments";
import viteCompression from "vite-plugin-compression";
import { ViteMinifyPlugin } from "vite-plugin-minify";

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
