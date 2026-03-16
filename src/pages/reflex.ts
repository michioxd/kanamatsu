import clsx from "clsx";
import { LitElement, html } from "lit";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";

import styles from "../app.module.scss";
import { DEFAULT_USER_DATA } from "../data";
import type { KanaItem, UserData } from "../types";

export class ReflexPage extends LitElement {
    static override properties = {
        reflexActive: { attribute: false },
        reflexScore: { attribute: false },
        currentReflexItem: { attribute: false },
        reflexOptions: { attribute: false },
        reflexTimeLeft: { attribute: false },
        reflexRoundKey: { attribute: false },
        reflexBarAnimating: { attribute: false },
        userData: { attribute: false },
        t: { attribute: false },
        onStartReflex: { attribute: false },
        onStopReflex: { attribute: false },
        onCheckReflexAnswer: { attribute: false },
    };

    declare reflexActive: boolean;
    declare reflexScore: number;
    declare currentReflexItem: KanaItem | null;
    declare reflexOptions: string[];
    declare reflexTimeLeft: number;
    declare reflexRoundKey: number;
    declare reflexBarAnimating: boolean;
    declare userData: UserData;
    declare t: (key: string) => string;
    declare onStartReflex: () => void;
    declare onStopReflex: () => void;
    declare onCheckReflexAnswer: (answer: string) => void;

    constructor() {
        super();
        this.reflexActive = false;
        this.reflexScore = 0;
        this.currentReflexItem = null;
        this.reflexOptions = [];
        this.reflexTimeLeft = 3000;
        this.reflexRoundKey = 0;
        this.reflexBarAnimating = false;
        this.userData = { ...DEFAULT_USER_DATA };
        this.t = (key) => key;
        this.onStartReflex = () => undefined;
        this.onStopReflex = () => undefined;
        this.onCheckReflexAnswer = () => undefined;
    }

    override createRenderRoot(): this {
        return this;
    }

    override render() {
        if (!this.reflexActive) {
            return html`
                <div>
                    <h2 class=${styles.textCenter}>${this.t("reflex_title")}</h2>
                    <p class=${clsx(styles.textCenter, styles.mutedText)}>${this.t("reflex_desc")}</p>
                    <div class=${clsx(styles.statsCard, styles.mt8, styles.textCenter)}>
                        <div class=${styles.statsLabel}>
                            <span>${this.t("high_score")}</span>
                            <span class=${styles.statsNumber}>${this.userData.highScore || 0}</span>
                        </div>
                    </div>
                    <div class=${clsx(styles.textCenter, styles.mt8)}>
                        <mdui-button
                            variant="filled"
                            icon="flash_on"
                            class=${styles.fullWidthButton}
                            @click=${this.onStartReflex}
                        >
                            ${this.t("btn_start_reflex")}
                        </mdui-button>
                    </div>
                </div>
            `;
        }

        return html`
            <div class=${styles.textCenter}>
                <div class=${clsx(styles.flexCenter, styles.mb4, styles.spaceBetween)}>
                    <span class=${styles.scoreText}> ${this.t("score_label")} <span>${this.reflexScore}</span> </span>
                    <mdui-button-icon icon="close" @click=${this.onStopReflex}></mdui-button-icon>
                </div>

                <div class=${styles.progressBarContainer}>
                    ${keyed(
                        this.reflexRoundKey,
                        html`<div
                            class=${styles.progressBarFill}
                            style=${styleMap({
                                width: this.reflexBarAnimating ? "0%" : "100%",
                                transition: this.reflexBarAnimating ? `width ${this.reflexTimeLeft}ms linear` : "none",
                            })}
                        ></div>`,
                    )}
                </div>

                <div class=${clsx(styles.statsCard, styles.mt4, styles.textCenter, styles.reflexCard)}>
                    <div class=${styles.kanaLarge}>${this.currentReflexItem?.kana}</div>
                </div>

                <div class=${clsx(styles.gridOptions, styles.mt8)}>
                    ${repeat(
                        this.reflexOptions,
                        (option) => option,
                        (option) => html`
                            <mdui-button variant="tonal" @click=${() => this.onCheckReflexAnswer(option)}>
                                ${option}
                            </mdui-button>
                        `,
                    )}
                </div>
            </div>
        `;
    }
}

if (!customElements.get("kana-reflex-page")) {
    customElements.define("kana-reflex-page", ReflexPage);
}
