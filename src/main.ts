import "./app";

const root = document.querySelector<HTMLDivElement>("#app");

if (root) {
    root.replaceChildren(document.createElement("kana-app"));
}
