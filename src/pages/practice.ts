import clsx from "clsx";
import { LitElement, html } from "lit";
import { repeat } from "lit/directives/repeat.js";

import styles from "../app.module.scss";
import type { KanaItem, MatchCardState, MemoryCardState, PracticeMode } from "../types";

export class PracticePage extends LitElement {
    static override properties = {
        practiceMode: { attribute: false },
        currentPracticeItem: { attribute: false },
        practiceOptions: { attribute: false },
        practiceSelectedAnswer: { attribute: false },
        practiceInputValue: { attribute: false },
        memoryCards: { attribute: false },
        matchCards: { attribute: false },
        t: { attribute: false },
        getQuizOptionVariant: { attribute: false },
        isCorrectQuizOption: { attribute: false },
        isWrongQuizOption: { attribute: false },
        onStopPractice: { attribute: false },
        onStartPractice: { attribute: false },
        onMemoryCardClick: { attribute: false },
        onMatchCardClick: { attribute: false },
        onCheckQuizAnswer: { attribute: false },
        onPracticeInput: { attribute: false },
        onPracticeKeyPress: { attribute: false },
        onCheckWritingAnswer: { attribute: false },
    };

    declare practiceMode: PracticeMode | "";
    declare currentPracticeItem: KanaItem | null;
    declare practiceOptions: string[];
    declare practiceSelectedAnswer: string | null;
    declare practiceInputValue: string;
    declare memoryCards: MemoryCardState[];
    declare matchCards: MatchCardState[];
    declare t: (key: string) => string;
    declare getQuizOptionVariant: (option: string) => "filled" | "tonal";
    declare isCorrectQuizOption: (option: string) => boolean;
    declare isWrongQuizOption: (option: string) => boolean;
    declare onStopPractice: () => void;
    declare onStartPractice: (mode: PracticeMode) => void;
    declare onMemoryCardClick: (index: number) => void;
    declare onMatchCardClick: (index: number) => void;
    declare onCheckQuizAnswer: (answer: string) => void;
    declare onPracticeInput: (event: Event) => void;
    declare onPracticeKeyPress: (event: KeyboardEvent) => void;
    declare onCheckWritingAnswer: () => void;

    constructor() {
        super();
        this.practiceMode = "";
        this.currentPracticeItem = null;
        this.practiceOptions = [];
        this.practiceSelectedAnswer = null;
        this.practiceInputValue = "";
        this.memoryCards = [];
        this.matchCards = [];
        this.t = (key) => key;
        this.getQuizOptionVariant = () => "tonal";
        this.isCorrectQuizOption = () => false;
        this.isWrongQuizOption = () => false;
        this.onStopPractice = () => undefined;
        this.onStartPractice = () => undefined;
        this.onMemoryCardClick = () => undefined;
        this.onMatchCardClick = () => undefined;
        this.onCheckQuizAnswer = () => undefined;
        this.onPracticeInput = () => undefined;
        this.onPracticeKeyPress = () => undefined;
        this.onCheckWritingAnswer = () => undefined;
    }

    override createRenderRoot(): this {
        return this;
    }

    override render() {
        if (this.practiceMode === "") {
            return html`
                <div>
                    <h2 class=${styles.textCenter}>${this.t("practice_select")}</h2>
                    <p class=${clsx(styles.textCenter, styles.mutedText)}>${this.t("practice_desc")}</p>

                    <div class=${styles.practiceModeGrid}>
                        ${this.renderPracticeModeCard("quiz", "quiz", this.t("prac_mcq"))}
                        ${this.renderPracticeModeCard("writing", "edit", this.t("prac_write"))}
                        ${this.renderPracticeModeCard("match", "join_inner", this.t("prac_match"))}
                        ${this.renderPracticeModeCard("memory", "style", this.t("prac_memory"))}
                    </div>
                </div>
            `;
        }

        if (this.practiceMode === "memory") {
            return html`
                <div>
                    ${this.renderPageHeader(this.t("title_memory"), this.onStopPractice)}
                    <div class=${styles.memoryGrid}>
                        ${repeat(
                            this.memoryCards,
                            (_, index) => index,
                            (card, index) => html`
                                <button
                                    type="button"
                                    class=${clsx(
                                        styles.memoryCard,
                                        !card.revealed && !card.matched && styles.hidden,
                                        card.matched && styles.matched,
                                    )}
                                    @click=${() => this.onMemoryCardClick(index)}
                                >
                                    ${card.revealed || card.matched ? card.text : ""}
                                </button>
                            `,
                        )}
                    </div>
                </div>
            `;
        }

        if (this.practiceMode === "match") {
            return html`
                <div>
                    ${this.renderPageHeader(this.t("title_match"), this.onStopPractice)}
                    <div class=${styles.matchGrid}>
                        ${repeat(
                            this.matchCards,
                            (_, index) => index,
                            (card, index) => html`
                                <button
                                    type="button"
                                    data-is-kana=${String(card.isKana)}
                                    class=${clsx(
                                        styles.matchCard,
                                        card.selected && styles.selected,
                                        card.matched && styles.matched,
                                        card.wrong && styles.wrong,
                                    )}
                                    @click=${() => this.onMatchCardClick(index)}
                                >
                                    ${card.text}
                                </button>
                            `,
                        )}
                    </div>
                </div>
            `;
        }

        return html`
            <div>
                ${this.renderPageHeader(
                    this.t(this.practiceMode === "quiz" ? "title_mcq" : "title_write"),
                    this.onStopPractice,
                )}

                <div class=${clsx(styles.statsCard, styles.mt8, styles.textCenter, styles.practiceCard)}>
                    <div class=${clsx(styles.typeLabel, styles.staticLabel)}>
                        ${this.currentPracticeItem?.type.toUpperCase()}
                    </div>
                    <div class=${styles.kanaLarge}>${this.currentPracticeItem?.kana}</div>
                </div>

                ${this.practiceMode === "quiz"
                    ? html`
                          <div class=${styles.gridOptions}>
                              ${repeat(
                                  this.practiceOptions,
                                  (option) => option,
                                  (option) => html`
                                      <mdui-button
                                          variant=${this.getQuizOptionVariant(option)}
                                          class=${clsx(
                                              this.isCorrectQuizOption(option) && styles.btnCorrect,
                                              this.isWrongQuizOption(option) && styles.btnWrong,
                                          )}
                                          ?disabled=${this.practiceSelectedAnswer !== null}
                                          @click=${() => this.onCheckQuizAnswer(option)}
                                      >
                                          ${option}
                                      </mdui-button>
                                  `,
                              )}
                          </div>
                      `
                    : html`
                          <div class=${clsx(styles.textCenter, styles.mt8)}>
                              <mdui-text-field
                                  .value=${this.practiceInputValue}
                                  label=${this.t("enter_romaji")}
                                  variant="outlined"
                                  class=${styles.writingField}
                                  @input=${this.onPracticeInput}
                                  @keypress=${this.onPracticeKeyPress}
                              ></mdui-text-field>
                              <div class=${styles.mt4}>
                                  <mdui-button
                                      variant="filled"
                                      @click=${this.onCheckWritingAnswer}
                                      ?disabled=${this.practiceInputValue.trim() === ""}
                                  >
                                      ${this.t("btn_check")}
                                  </mdui-button>
                              </div>
                          </div>
                      `}
            </div>
        `;
    }

    private renderPracticeModeCard(mode: PracticeMode, icon: string, label: string) {
        return html`
            <mdui-card clickable class=${styles.practiceModeCard} @click=${() => this.onStartPractice(mode)}>
                <mdui-icon name=${icon}></mdui-icon>
                <span>${label}</span>
            </mdui-card>
        `;
    }

    private renderPageHeader(title: string, onBack: () => void) {
        return html`
            <div class=${clsx(styles.titleRow, styles.mb4)}>
                <mdui-button-icon icon="arrow_back" @click=${onBack}></mdui-button-icon>
                <span class=${styles.pageTitle}>${title}</span>
                <span></span>
            </div>
        `;
    }
}

if (!customElements.get("kana-practice-page")) {
    customElements.define("kana-practice-page", PracticePage);
}
