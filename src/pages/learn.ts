import clsx from "clsx";
import { LitElement, html, nothing } from "lit";

import styles from "../app.module.scss";
import type { KanaItem, LearnMode } from "../types";

export class LearnPage extends LitElement {
    static override properties = {
        learnMode: { attribute: false },
        learnBatchSize: { attribute: false },
        includeDakuten: { attribute: false },
        includeYoon: { attribute: false },
        learnReview: { attribute: false },
        learnShuffle: { attribute: false },
        currentLearnSession: { attribute: false },
        currentLearnIndex: { attribute: false },
        learnCardFlipped: { attribute: false },
        t: { attribute: false },
        onLearnModeChange: { attribute: false },
        onBatchSliderInput: { attribute: false },
        onLearnReviewChange: { attribute: false },
        onLearnShuffleChange: { attribute: false },
        onDakutenChange: { attribute: false },
        onYoonChange: { attribute: false },
        onStartLearn: { attribute: false },
        onFlipLearnCard: { attribute: false },
        onPrevLearnCard: { attribute: false },
        onNextLearnCard: { attribute: false },
    };

    declare learnMode: LearnMode;
    declare learnBatchSize: number;
    declare includeDakuten: boolean;
    declare includeYoon: boolean;
    declare learnReview: boolean;
    declare learnShuffle: boolean;
    declare currentLearnSession: KanaItem[];
    declare currentLearnIndex: number;
    declare learnCardFlipped: boolean;
    declare t: (key: string) => string;
    declare onLearnModeChange: (event: Event) => void;
    declare onBatchSliderInput: (event: Event) => void;
    declare onLearnReviewChange: (event: Event) => void;
    declare onLearnShuffleChange: (event: Event) => void;
    declare onDakutenChange: (event: Event) => void;
    declare onYoonChange: (event: Event) => void;
    declare onStartLearn: () => void;
    declare onFlipLearnCard: () => void;
    declare onPrevLearnCard: () => void;
    declare onNextLearnCard: () => void;

    constructor() {
        super();
        this.learnMode = "both";
        this.learnBatchSize = 5;
        this.includeDakuten = false;
        this.includeYoon = false;
        this.learnReview = false;
        this.learnShuffle = false;
        this.currentLearnSession = [];
        this.currentLearnIndex = 0;
        this.learnCardFlipped = false;
        this.t = (key) => key;
        this.onLearnModeChange = () => undefined;
        this.onBatchSliderInput = () => undefined;
        this.onLearnReviewChange = () => undefined;
        this.onLearnShuffleChange = () => undefined;
        this.onDakutenChange = () => undefined;
        this.onYoonChange = () => undefined;
        this.onStartLearn = () => undefined;
        this.onFlipLearnCard = () => undefined;
        this.onPrevLearnCard = () => undefined;
        this.onNextLearnCard = () => undefined;
    }

    override createRenderRoot(): this {
        return this;
    }

    override render() {
        const learnItem = this.currentLearnSession[this.currentLearnIndex] ?? null;

        if (this.currentLearnSession.length === 0) {
            return this.renderLearnSetup();
        }

        return html`
            <div>
                <div class=${clsx(styles.textCenter, styles.mb4)}>
                    <span>
                        ${this.t("card_progress")
                            .replace("{current}", String(this.currentLearnIndex + 1))
                            .replace("{total}", String(this.currentLearnSession.length))}
                    </span>
                </div>

                <div class=${styles.flashcardContainer} @click=${this.onFlipLearnCard}>
                    <div class=${clsx(styles.flashcard, this.learnCardFlipped && styles.flipped)}>
                        <div class=${styles.flashcardFace}>
                            <div class=${styles.typeLabel}>${learnItem?.type.toUpperCase() ?? nothing}</div>
                            <div class=${styles.kanaLarge}>${learnItem?.kana ?? nothing}</div>
                            <div class=${styles.tapHint}>${this.t("tap_to_flip")}</div>
                        </div>
                        <div class=${clsx(styles.flashcardFace, styles.flashcardBack)}>
                            <div class=${styles.typeLabel}>ROMAJI</div>
                            <div class=${styles.romajiLarge}>${learnItem?.romaji ?? nothing}</div>
                        </div>
                    </div>
                </div>

                <div class=${clsx(styles.flexCenter, styles.mt8)}>
                    <mdui-button
                        variant="tonal"
                        ?disabled=${this.currentLearnIndex === 0}
                        @click=${this.onPrevLearnCard}
                    >
                        ${this.t("btn_prev")}
                    </mdui-button>
                    <mdui-button variant="filled" @click=${this.onNextLearnCard}> ${this.t("btn_next")} </mdui-button>
                </div>
            </div>
        `;
    }

    private renderLearnSetup() {
        return html`
            <div>
                <div class=${styles.statsCard}>
                    <h3 class=${styles.sectionHeading}>${this.t("learn_settings")}</h3>

                    <p class=${styles.sectionLabel}>${this.t("alphabets")}</p>
                    <mdui-radio-group
                        .value=${this.learnMode}
                        class=${styles.flexColumn}
                        @change=${this.onLearnModeChange}
                    >
                        <mdui-radio value="hiragana">${this.t("hira_only")}</mdui-radio>
                        <mdui-radio value="katakana">${this.t("kata_only")}</mdui-radio>
                        <mdui-radio value="both">${this.t("both_kana")}</mdui-radio>
                    </mdui-radio-group>

                    <mdui-divider class=${styles.sectionDivider}></mdui-divider>

                    <p class=${styles.sectionLabel}>${this.t("learn_options")}</p>
                    <div class=${styles.flexColumnCompact}>
                        <mdui-checkbox .checked=${this.learnReview} @change=${this.onLearnReviewChange}>
                            ${this.t("review_mode")}
                        </mdui-checkbox>
                        <mdui-checkbox .checked=${this.learnShuffle} @change=${this.onLearnShuffleChange}>
                            ${this.t("shuffle_cards")}
                        </mdui-checkbox>
                    </div>

                    <mdui-divider class=${styles.sectionDivider}></mdui-divider>

                    <p class=${styles.sectionLabel}>${this.t("advanced_options")}</p>
                    <div class=${styles.flexColumnCompact}>
                        <mdui-checkbox .checked=${this.includeDakuten} @change=${this.onDakutenChange}>
                            ${this.t("include_dakuten")}
                        </mdui-checkbox>
                        <mdui-checkbox .checked=${this.includeYoon} @change=${this.onYoonChange}>
                            ${this.t("include_yoon")}
                        </mdui-checkbox>
                    </div>

                    <mdui-divider class=${styles.sectionDivider}></mdui-divider>

                    <p class=${styles.sectionLabel}>${this.t("cards_per_batch")}</p>
                    <mdui-slider
                        min="5"
                        max="15"
                        step="5"
                        .value=${this.learnBatchSize}
                        @input=${this.onBatchSliderInput}
                    ></mdui-slider>
                    <div class=${clsx(styles.textCenter, styles.mt2, styles.batchValue)}>
                        ${this.t("cards_count").replace("{n}", String(this.learnBatchSize))}
                    </div>
                </div>

                <div class=${clsx(styles.textCenter, styles.mt8)}>
                    <mdui-button
                        variant="filled"
                        icon="play_arrow"
                        class=${styles.fullWidthButton}
                        @click=${this.onStartLearn}
                    >
                        ${this.t("start_learning")}
                    </mdui-button>
                </div>
            </div>
        `;
    }
}

if (!customElements.get("kana-learn-page")) {
    customElements.define("kana-learn-page", LearnPage);
}
