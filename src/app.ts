import "mdui/mdui.css";
import "mdui";
import "@fontsource/material-icons/index.css";
import "@fontsource/material-icons-outlined/index.css";
import "@fontsource/google-sans-flex/400.css";
import "@fontsource/google-sans-flex/500.css";
import "@fontsource/google-sans-flex/700.css";
import "@fontsource/noto-serif-jp/400.css";
import "@fontsource/noto-serif-jp/500.css";
import "@fontsource/noto-serif-jp/700.css";

import clsx from "clsx";
import { LitElement, html } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { snackbar } from "mdui/functions/snackbar.js";

import styles from "./app.module.scss";
import "./pages/learn";
import "./pages/practice";
import "./pages/reflex";
import { APP_VERSION, DEFAULT_USER_DATA } from "./data";
import KANA_DATA from "./kana";
import TRANSLATIONS from "./i18n";
import { loadUserData, normalizeUserData, saveUserData } from "./storage";
import type {
    KanaItem,
    Language,
    LearnMode,
    MatchCardState,
    MemoryCardState,
    PageId,
    PracticeMode,
    UserData,
} from "./types";
import { downloadJson, readJsonFile, sampleUnique, shuffle } from "./utils";

export class Kanamatsu extends LitElement {
    private userData: UserData = loadUserData();
    private activePage: PageId = "learn";

    private learnMode: LearnMode = this.userData.learnMode;
    private learnBatchSize = this.userData.learnBatchSize;
    private includeDakuten = this.userData.includeDakuten;
    private includeYoon = this.userData.includeYoon;
    private learnReview = this.userData.learnReview;
    private learnShuffle = this.userData.learnShuffle;
    private currentLearnSession: KanaItem[] = [];
    private currentLearnIndex = 0;
    private learnCardFlipped = false;

    private practiceMode: PracticeMode | "" = "";
    private currentPracticeItem: KanaItem | null = null;
    private practiceQueue: KanaItem[] = [];
    private practiceOptions: string[] = [];
    private practiceSelectedAnswer: string | null = null;
    private practiceInputValue = "";

    private memoryCards: MemoryCardState[] = [];
    private memoryFlippedIndexes: number[] = [];
    private memoryMatches = 0;
    private memoryTotalPairs = 0;

    private matchCards: MatchCardState[] = [];
    private matchSelectedIndex: number | null = null;
    private matchPairsFound = 0;
    private matchTotalPairs = 0;
    private matchIsAnimating = false;

    private reflexTimer: number | null = null;
    private reflexScore = 0;
    private currentReflexItem: KanaItem | null = null;
    private reflexOptions: string[] = [];
    private reflexActive = false;
    private reflexTimeLeft = 3000;
    private reflexRoundKey = 0;
    private reflexBarAnimating = false;

    private finishDialogOpen = false;
    private clearDialogOpen = false;

    private scheduledTimeouts = new Set<number>();
    private reflexBarFrame: number | null = null;

    override createRenderRoot(): this {
        return this;
    }

    override connectedCallback(): void {
        super.connectedCallback();
        this.applyDocumentState();
    }

    override disconnectedCallback(): void {
        this.clearScheduledTimeouts();
        this.clearReflexTimer();
        this.clearReflexBarFrame();
        super.disconnectedCallback();
    }

    protected override updated(): void {
        this.applyDocumentState();
    }

    override render() {
        return html`
            <mdui-layout>
                <mdui-top-app-bar color="primary">
                    <mdui-top-app-bar-title scroll-behavior="elevate" scroll-target=${"." + styles.main}
                        >kanamatsu</mdui-top-app-bar-title
                    >
                    <mdui-dropdown placement="bottom-end" trigger="click">
                        <mdui-button-icon
                            slot="trigger"
                            icon="translate"
                            title=${this.t("tooltip_lang")}
                        ></mdui-button-icon>
                        <mdui-menu>
                            ${this.renderLanguageItem("vi", "Tiếng Việt")} ${this.renderLanguageItem("en", "English")}
                        </mdui-menu>
                    </mdui-dropdown>
                    <mdui-tooltip content=${this.t("tooltip_font")}>
                        <mdui-button-icon
                            icon=${this.userData.font === "noto" ? "font_download" : "text_format"}
                            title=${this.t("tooltip_font")}
                            @click=${this.handleFontToggle}
                        ></mdui-button-icon>
                    </mdui-tooltip>
                    <mdui-tooltip content=${this.t("tooltip_theme")}>
                        <mdui-button-icon
                            icon=${this.getThemeIcon()}
                            title=${this.t("tooltip_theme")}
                            @click=${this.handleThemeToggle}
                        ></mdui-button-icon>
                    </mdui-tooltip>
                </mdui-top-app-bar>

                <mdui-layout-main class=${styles.main}>
                    <div class=${this.pageClass("learn")}>
                        <kana-learn-page
                            .learnMode=${this.learnMode}
                            .learnBatchSize=${this.learnBatchSize}
                            .includeDakuten=${this.includeDakuten}
                            .includeYoon=${this.includeYoon}
                            .learnReview=${this.learnReview}
                            .learnShuffle=${this.learnShuffle}
                            .currentLearnSession=${this.currentLearnSession}
                            .currentLearnIndex=${this.currentLearnIndex}
                            .learnCardFlipped=${this.learnCardFlipped}
                            .t=${this.t.bind(this)}
                            .onLearnModeChange=${this.handleLearnModeChange}
                            .onBatchSliderInput=${this.handleBatchSliderInput}
                            .onLearnReviewChange=${this.handleLearnReviewChange}
                            .onLearnShuffleChange=${this.handleLearnShuffleChange}
                            .onDakutenChange=${this.handleDakutenChange}
                            .onYoonChange=${this.handleYoonChange}
                            .onStartLearn=${this.handleStartLearn}
                            .onFlipLearnCard=${this.flipLearnCard}
                            .onPrevLearnCard=${this.handlePrevLearnCard}
                            .onNextLearnCard=${this.handleNextLearnCard}
                        ></kana-learn-page>
                    </div>

                    <div class=${this.pageClass("practice")}>
                        <kana-practice-page
                            .practiceMode=${this.practiceMode}
                            .currentPracticeItem=${this.currentPracticeItem}
                            .practiceOptions=${this.practiceOptions}
                            .practiceSelectedAnswer=${this.practiceSelectedAnswer}
                            .practiceInputValue=${this.practiceInputValue}
                            .memoryCards=${this.memoryCards}
                            .matchCards=${this.matchCards}
                            .t=${this.t.bind(this)}
                            .getQuizOptionVariant=${this.getQuizOptionVariant.bind(this)}
                            .isCorrectQuizOption=${this.isCorrectQuizOption.bind(this)}
                            .isWrongQuizOption=${this.isWrongQuizOption.bind(this)}
                            .onStopPractice=${this.stopPractice}
                            .onStartPractice=${this.startPractice}
                            .onMemoryCardClick=${this.handleMemoryCardClick}
                            .onMatchCardClick=${this.handleMatchCardClick}
                            .onCheckQuizAnswer=${this.checkQuizAnswer}
                            .onPracticeInput=${this.handlePracticeInput}
                            .onPracticeKeyPress=${this.handlePracticeKeyPress}
                            .onCheckWritingAnswer=${this.checkWritingAnswer}
                        ></kana-practice-page>
                    </div>

                    <div class=${this.pageClass("reflex")}>
                        <kana-reflex-page
                            .reflexActive=${this.reflexActive}
                            .reflexScore=${this.reflexScore}
                            .currentReflexItem=${this.currentReflexItem}
                            .reflexOptions=${this.reflexOptions}
                            .reflexTimeLeft=${this.reflexTimeLeft}
                            .reflexRoundKey=${this.reflexRoundKey}
                            .reflexBarAnimating=${this.reflexBarAnimating}
                            .userData=${this.userData}
                            .t=${this.t.bind(this)}
                            .onStartReflex=${this.startReflex}
                            .onStopReflex=${this.stopReflex}
                            .onCheckReflexAnswer=${this.checkReflexAnswer}
                        ></kana-reflex-page>
                    </div>

                    <div class=${this.pageClass("settings")}>${this.renderSettingsPage()}</div>

                    <div class=${this.pageClass("list")}>${this.renderLearnedListPage()}</div>
                </mdui-layout-main>

                <mdui-navigation-bar .value=${this.activePage} @change=${this.handlePageChange}>
                    <mdui-navigation-bar-item value="learn" icon="school">
                        <span>${this.t("nav_learn")}</span>
                    </mdui-navigation-bar-item>
                    <mdui-navigation-bar-item value="practice" icon="fitness_center">
                        <span>${this.t("nav_practice")}</span>
                    </mdui-navigation-bar-item>
                    <mdui-navigation-bar-item value="reflex" icon="bolt">
                        <span>${this.t("nav_reflex")}</span>
                    </mdui-navigation-bar-item>
                    <mdui-navigation-bar-item value="list" icon="grid_view">
                        <span>${this.t("nav_list")}</span>
                    </mdui-navigation-bar-item>
                    <mdui-navigation-bar-item value="settings" icon="settings">
                        <span>${this.t("nav_settings")}</span>
                    </mdui-navigation-bar-item>
                </mdui-navigation-bar>
            </mdui-layout>

            <mdui-dialog .open=${this.finishDialogOpen} headline=${this.t("dialog_finish_title")}>
                <div>${this.t("dialog_finish_desc")}</div>
                <mdui-button slot="action" variant="text" @click=${this.closeFinishDialog}>
                    ${this.t("btn_stay")}
                </mdui-button>
                <mdui-button slot="action" variant="filled" @click=${this.goToPracticeFromDialog}>
                    ${this.t("btn_go_practice")}
                </mdui-button>
            </mdui-dialog>

            <mdui-dialog .open=${this.clearDialogOpen} headline=${this.t("dialog_clear_title")}>
                <div>${this.t("dialog_clear_desc")}</div>
                <mdui-button slot="action" variant="text" @click=${this.closeClearDialog}>
                    ${this.t("btn_cancel")}
                </mdui-button>
                <mdui-button
                    slot="action"
                    variant="filled"
                    class=${styles.dialogDangerButton}
                    @click=${this.confirmClearData}
                >
                    ${this.t("btn_delete")}
                </mdui-button>
            </mdui-dialog>
        `;
    }

    private renderLanguageItem(lang: Language, label: string) {
        return this.userData.lang === lang
            ? html`<mdui-menu-item value=${lang} icon="check" @click=${() => this.changeLang(lang)}
                  >${label}</mdui-menu-item
              >`
            : html`<mdui-menu-item value=${lang} @click=${() => this.changeLang(lang)}>${label}</mdui-menu-item>`;
    }

    private renderSettingsPage() {
        return html`
            <div>
                <h2 class=${styles.textCenter}>${this.t("settings_title")}</h2>

                <div class=${clsx(styles.statsCard, styles.textCenter)}>
                    <p>${this.t("learned_count")}</p>
                    <div class=${styles.statsNumber}>${this.userData.learnedIds.length}</div>
                    <p class=${styles.subtleText}>${this.t("total_chars")}</p>
                </div>

                <div class=${styles.settingsListWrap}>
                    <mdui-list class=${styles.settingsList}>
                        <mdui-list-item icon="file_download" @click=${this.exportData}>
                            <span>${this.t("export_data")}</span>
                        </mdui-list-item>
                        <mdui-list-item icon="file_upload" @click=${this.openImportDialog}>
                            <span>${this.t("import_data")}</span>
                        </mdui-list-item>
                        <input
                            type="file"
                            id="import-file"
                            class=${styles.hiddenInput}
                            accept=".json"
                            @change=${this.handleImportData}
                        />

                        <mdui-divider></mdui-divider>

                        <mdui-list-item
                            icon="delete_forever"
                            class=${styles.dangerAction}
                            @click=${this.openClearDialog}
                        >
                            <span>${this.t("clear_data")}</span>
                        </mdui-list-item>
                    </mdui-list>
                </div>
                <div class=${clsx(styles.textCenter, styles.mt8, styles.mutedText, "mdui-prose")}>
                    <small
                        >kanamatsu v${APP_VERSION} -
                        <a href="https://michioxd.ch" target="_blank">michioxd</a> powered</small
                    ><br />
                    <small>built with TypeScript, MDUI, Lit, and Vite</small>
                    <br />
                    <mdui-button
                        href="//github.com/michioxd/kanamatsu"
                        target="_blank"
                        title="GitHub Repository"
                        variant="outlined"
                    >
                        GitHub Repository
                    </mdui-button>
                </div>
            </div>
        `;
    }

    private renderLearnedListPage() {
        return html`
            <div>
                <h2 class=${styles.textCenter}>${this.t("learned_list_title")}</h2>
                <div class=${styles.listContainer}>
                    ${this.renderAlphabetSection("Hiragana", "hiragana")}
                    ${this.renderAlphabetSection("Katakana", "katakana")}
                </div>
            </div>
        `;
    }

    private renderAlphabetSection(title: string, type: "hiragana" | "katakana") {
        return html`
            <div class=${styles.alphabetSection}>
                <h4>${title}</h4>
                <div class=${styles.alphabetGrid}>
                    ${repeat(
                        KANA_DATA.filter((item) => item.type === type),
                        (item) => item.id,
                        (item) => html`
                            <div
                                class=${clsx(
                                    styles.kanaBox,
                                    this.userData.learnedIds.includes(item.id) && styles.learned,
                                )}
                            >
                                <div class=${styles.kChar}>${item.kana}</div>
                                <div class=${styles.kRom}>${item.romaji}</div>
                            </div>
                        `,
                    )}
                </div>
            </div>
        `;
    }

    private t(key: string): string {
        return TRANSLATIONS[this.userData.lang][key] ?? key;
    }

    private pageClass(page: PageId): string {
        return clsx(styles.page, this.activePage === page && styles.pageActive);
    }

    private getThemeIcon(): string {
        return this.userData.theme === "light"
            ? "light_mode"
            : this.userData.theme === "dark"
              ? "dark_mode"
              : "brightness_auto";
    }

    private applyDocumentState(): void {
        document.documentElement.classList.remove("mdui-theme-auto", "mdui-theme-light", "mdui-theme-dark");
        document.documentElement.classList.add(`mdui-theme-${this.userData.theme}`);
        document.body.classList.toggle("use-noto-font", this.userData.font === "noto");
    }

    private persist(): void {
        saveUserData(this.userData);
        this.requestUpdate();
    }

    private syncLearnSettingsFromUserData(): void {
        this.learnMode = this.userData.learnMode;
        this.learnBatchSize = this.userData.learnBatchSize;
        this.includeDakuten = this.userData.includeDakuten;
        this.includeYoon = this.userData.includeYoon;
        this.learnReview = this.userData.learnReview;
        this.learnShuffle = this.userData.learnShuffle;
    }

    private persistLearnSettings(): void {
        this.userData = {
            ...this.userData,
            learnMode: this.learnMode,
            learnBatchSize: this.learnBatchSize,
            includeDakuten: this.includeDakuten,
            includeYoon: this.includeYoon,
            learnReview: this.learnReview,
            learnShuffle: this.learnShuffle,
        };
        this.persist();
    }

    private showToast(message: string): void {
        snackbar({ message });
    }

    private getLearnedData(): KanaItem[] {
        return KANA_DATA.filter((item) => this.userData.learnedIds.includes(item.id));
    }

    private uniqueRomajiPool(exclude: string): string[] {
        return Array.from(new Set(this.getLearnedData().map((item) => item.romaji))).filter(
            (romaji) => romaji !== exclude,
        );
    }

    private schedule(callback: () => void, delay: number): void {
        const timeoutId = window.setTimeout(() => {
            this.scheduledTimeouts.delete(timeoutId);
            callback();
        }, delay);
        this.scheduledTimeouts.add(timeoutId);
    }

    private clearScheduledTimeouts(): void {
        this.scheduledTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
        this.scheduledTimeouts.clear();
    }

    private clearReflexTimer(): void {
        if (this.reflexTimer !== null) {
            window.clearTimeout(this.reflexTimer);
            this.reflexTimer = null;
        }
    }

    private clearReflexBarFrame(): void {
        if (this.reflexBarFrame !== null) {
            window.cancelAnimationFrame(this.reflexBarFrame);
            this.reflexBarFrame = null;
        }
    }

    private startReflexBarAnimation(): void {
        this.clearReflexBarFrame();
        void this.updateComplete.then(() => {
            this.reflexBarFrame = window.requestAnimationFrame(() => {
                this.reflexBarFrame = null;
                if (!this.reflexActive) return;
                this.reflexBarAnimating = true;
                this.requestUpdate();
            });
        });
    }

    private readonly handlePageChange = (event: Event): void => {
        const target = event.currentTarget as HTMLElement & { value?: string };
        const page = (target.value ?? "learn") as PageId;

        this.activePage = page;
        if (page !== "learn") {
            this.currentLearnSession = [];
            this.currentLearnIndex = 0;
            this.learnCardFlipped = false;
        }
        if (page === "practice") {
            this.stopPractice();
        }
        if (page !== "reflex") {
            this.stopReflex();
        }
        this.requestUpdate();
    };

    private readonly handleThemeToggle = (): void => {
        const themes = ["auto", "light", "dark"] as const;
        const currentIndex = themes.indexOf(this.userData.theme);
        this.userData = {
            ...this.userData,
            theme: themes[(currentIndex + 1) % themes.length],
        };
        this.persist();
    };

    private readonly handleFontToggle = (): void => {
        this.userData = {
            ...this.userData,
            font: this.userData.font === "noto" ? "default" : "noto",
        };
        this.persist();
    };

    private readonly handleLearnModeChange = (event: Event): void => {
        const target = event.currentTarget as HTMLElement & { value?: string };
        this.learnMode = (target.value ?? "both") as LearnMode;
        this.persistLearnSettings();
    };

    private readonly handleBatchSliderInput = (event: Event): void => {
        const target = event.currentTarget as HTMLElement & { value?: string };
        this.learnBatchSize = Number.parseInt(target.value ?? "5", 10);
        this.persistLearnSettings();
    };

    private readonly handleLearnReviewChange = (event: Event): void => {
        const target = event.currentTarget as HTMLElement & { checked?: boolean };
        this.learnReview = Boolean(target.checked);
        this.persistLearnSettings();
    };

    private readonly handleLearnShuffleChange = (event: Event): void => {
        const target = event.currentTarget as HTMLElement & { checked?: boolean };
        this.learnShuffle = Boolean(target.checked);
        this.persistLearnSettings();
    };

    private readonly handleDakutenChange = (event: Event): void => {
        const target = event.currentTarget as HTMLElement & { checked?: boolean };
        this.includeDakuten = Boolean(target.checked);
        this.persistLearnSettings();
    };

    private readonly handleYoonChange = (event: Event): void => {
        const target = event.currentTarget as HTMLElement & { checked?: boolean };
        this.includeYoon = Boolean(target.checked);
        this.persistLearnSettings();
    };

    private readonly handleStartLearn = (): void => {
        let pool = KANA_DATA.filter((item) => {
            const isLearned = this.userData.learnedIds.includes(item.id);
            return this.learnReview ? isLearned : !isLearned;
        });

        if (this.learnMode !== "both") {
            pool = pool.filter((item) => item.type === this.learnMode);
        }

        pool = pool.filter((item) => {
            if (item.isYoon) return this.includeYoon;
            if (item.isDakuten) return this.includeDakuten;
            return true;
        });

        if (pool.length === 0) {
            this.showToast(this.learnReview ? this.t("toast_no_review") : this.t("toast_all_learned"));
            return;
        }

        this.currentLearnSession = (this.learnShuffle ? shuffle(pool) : pool).slice(0, this.learnBatchSize);
        this.currentLearnIndex = 0;
        this.learnCardFlipped = false;
        this.requestUpdate();
    };

    private readonly flipLearnCard = (): void => {
        if (this.currentLearnSession.length === 0) return;
        this.learnCardFlipped = !this.learnCardFlipped;
        this.requestUpdate();
    };

    private readonly handleNextLearnCard = (): void => {
        const item = this.currentLearnSession[this.currentLearnIndex];
        if (!item) return;

        if (!this.userData.learnedIds.includes(item.id)) {
            this.userData = {
                ...this.userData,
                learnedIds: [...this.userData.learnedIds, item.id],
            };
            this.persist();
        }

        if (this.currentLearnIndex < this.currentLearnSession.length - 1) {
            this.currentLearnIndex += 1;
            this.learnCardFlipped = false;
            this.requestUpdate();
            return;
        }

        this.currentLearnSession = [];
        this.currentLearnIndex = 0;
        this.learnCardFlipped = false;
        this.finishDialogOpen = true;
        this.requestUpdate();
    };

    private readonly handlePrevLearnCard = (): void => {
        if (this.currentLearnIndex > 0) {
            this.currentLearnIndex -= 1;
            this.learnCardFlipped = false;
            this.requestUpdate();
        }
    };

    private readonly closeFinishDialog = (): void => {
        this.finishDialogOpen = false;
        this.requestUpdate();
    };

    private readonly goToPracticeFromDialog = (): void => {
        this.finishDialogOpen = false;
        this.activePage = "practice";
        this.stopPractice();
        this.requestUpdate();
    };

    private readonly startPractice = (mode: PracticeMode): void => {
        const learned = this.getLearnedData();
        if (learned.length < 4) {
            this.showToast(this.t("toast_need_4_practice"));
            return;
        }

        this.clearScheduledTimeouts();
        this.practiceMode = mode;
        this.practiceSelectedAnswer = null;
        this.practiceInputValue = "";

        if (mode === "quiz" || mode === "writing") {
            this.practiceQueue = shuffle(learned);
            this.nextStandardPractice();
            return;
        }

        if (mode === "memory") {
            this.startMemoryGame(learned);
            return;
        }

        this.startMatchGame(learned);
    };

    private readonly stopPractice = (): void => {
        this.clearScheduledTimeouts();
        this.practiceMode = "";
        this.currentPracticeItem = null;
        this.practiceQueue = [];
        this.practiceOptions = [];
        this.practiceSelectedAnswer = null;
        this.practiceInputValue = "";
        this.memoryCards = [];
        this.memoryFlippedIndexes = [];
        this.memoryMatches = 0;
        this.memoryTotalPairs = 0;
        this.matchCards = [];
        this.matchSelectedIndex = null;
        this.matchPairsFound = 0;
        this.matchTotalPairs = 0;
        this.matchIsAnimating = false;
        this.requestUpdate();
    };

    private nextStandardPractice(): void {
        if (this.practiceQueue.length === 0) {
            this.practiceQueue = shuffle(this.getLearnedData());
            this.showToast(this.t("toast_round_finish"));
        }

        const item = this.practiceQueue.shift() ?? null;
        this.currentPracticeItem = item;
        this.practiceSelectedAnswer = null;
        this.practiceInputValue = "";

        if (item && this.practiceMode === "quiz") {
            const distractors = sampleUnique(this.uniqueRomajiPool(item.romaji), 3);
            this.practiceOptions = shuffle([item.romaji, ...distractors]);
        } else {
            this.practiceOptions = [];
        }

        this.requestUpdate();
    }

    private getQuizOptionVariant(option: string): "filled" | "tonal" {
        return this.isCorrectQuizOption(option) || this.isWrongQuizOption(option) ? "filled" : "tonal";
    }

    private isCorrectQuizOption(option: string): boolean {
        return this.practiceSelectedAnswer !== null && option === this.currentPracticeItem?.romaji;
    }

    private isWrongQuizOption(option: string): boolean {
        return (
            this.practiceSelectedAnswer !== null &&
            this.practiceSelectedAnswer !== this.currentPracticeItem?.romaji &&
            option === this.practiceSelectedAnswer
        );
    }

    private readonly checkQuizAnswer = (answer: string): void => {
        if (!this.currentPracticeItem || this.practiceSelectedAnswer !== null) return;

        this.practiceSelectedAnswer = answer;
        if (answer === this.currentPracticeItem.romaji) {
            this.requestUpdate();
            this.schedule(() => this.nextStandardPractice(), 800);
            return;
        }

        this.practiceQueue.push(this.currentPracticeItem);
        this.requestUpdate();
        this.schedule(() => this.nextStandardPractice(), 2000);
    };

    private readonly handlePracticeInput = (event: Event): void => {
        const target = event.currentTarget as HTMLElement & { value?: string };
        this.practiceInputValue = target.value ?? "";
        this.requestUpdate();
    };

    private readonly handlePracticeKeyPress = (event: KeyboardEvent): void => {
        if (event.key === "Enter") {
            this.checkWritingAnswer();
        }
    };

    private readonly checkWritingAnswer = (): void => {
        if (!this.currentPracticeItem) return;

        if (this.practiceInputValue.trim().toLowerCase() === this.currentPracticeItem.romaji) {
            this.showToast(this.t("toast_correct"));
            this.schedule(() => this.nextStandardPractice(), 800);
            return;
        }

        this.showToast(this.t("toast_wrong").replace("{ans}", this.currentPracticeItem.romaji));
        this.practiceQueue.push(this.currentPracticeItem);
        this.schedule(() => this.nextStandardPractice(), 2000);
    };

    private startMemoryGame(learned: KanaItem[]): void {
        const selected = sampleUnique(learned, 6);
        this.memoryTotalPairs = selected.length;
        this.memoryMatches = 0;
        this.memoryFlippedIndexes = [];
        this.memoryCards = shuffle(
            selected.flatMap((item) => [
                { id: item.id, text: item.kana, revealed: false, matched: false },
                { id: item.id, text: item.romaji, revealed: false, matched: false },
            ]),
        );
        this.requestUpdate();
    }

    private readonly handleMemoryCardClick = (index: number): void => {
        const card = this.memoryCards[index];
        if (!card || card.matched || card.revealed || this.memoryFlippedIndexes.length >= 2) {
            return;
        }

        this.memoryCards = this.memoryCards.map((item, itemIndex) =>
            itemIndex === index ? { ...item, revealed: true } : item,
        );
        this.memoryFlippedIndexes = [...this.memoryFlippedIndexes, index];
        this.requestUpdate();

        if (this.memoryFlippedIndexes.length < 2) {
            return;
        }

        const [firstIndex, secondIndex] = this.memoryFlippedIndexes;
        const first = this.memoryCards[firstIndex];
        const second = this.memoryCards[secondIndex];

        if (first && second && first.id === second.id) {
            this.schedule(() => {
                this.memoryCards = this.memoryCards.map((item, itemIndex) =>
                    itemIndex === firstIndex || itemIndex === secondIndex ? { ...item, matched: true } : item,
                );
                this.memoryFlippedIndexes = [];
                this.memoryMatches += 1;
                this.requestUpdate();

                if (this.memoryMatches === this.memoryTotalPairs) {
                    this.showToast(this.t("toast_memory_finish"));
                    this.schedule(() => this.startMemoryGame(this.getLearnedData()), 1500);
                }
            }, 500);
            return;
        }

        this.schedule(() => {
            this.memoryCards = this.memoryCards.map((item, itemIndex) =>
                itemIndex === firstIndex || itemIndex === secondIndex ? { ...item, revealed: false } : item,
            );
            this.memoryFlippedIndexes = [];
            this.requestUpdate();
        }, 1000);
    };

    private startMatchGame(learned: KanaItem[]): void {
        const selected = sampleUnique(learned, 5);
        this.matchTotalPairs = selected.length;
        this.matchPairsFound = 0;
        this.matchSelectedIndex = null;
        this.matchIsAnimating = false;
        this.matchCards = shuffle(
            selected.flatMap((item) => [
                {
                    id: item.id,
                    text: item.kana,
                    isKana: true,
                    matched: false,
                    selected: false,
                    wrong: false,
                },
                {
                    id: item.id,
                    text: item.romaji,
                    isKana: false,
                    matched: false,
                    selected: false,
                    wrong: false,
                },
            ]),
        );
        this.requestUpdate();
    }

    private readonly handleMatchCardClick = (index: number): void => {
        const card = this.matchCards[index];
        if (!card || this.matchIsAnimating || card.matched || index === this.matchSelectedIndex) {
            return;
        }

        if (this.matchSelectedIndex === null) {
            this.matchSelectedIndex = index;
            this.matchCards = this.matchCards.map((item, itemIndex) =>
                itemIndex === index ? { ...item, selected: true } : item,
            );
            this.requestUpdate();
            return;
        }

        const firstIndex = this.matchSelectedIndex;
        const first = this.matchCards[firstIndex];
        if (!first) return;

        const matched = first.id === card.id && first.isKana !== card.isKana;
        if (matched) {
            this.matchIsAnimating = true;
            this.matchCards = this.matchCards.map((item, itemIndex) =>
                itemIndex === firstIndex || itemIndex === index ? { ...item, selected: true } : item,
            );
            this.requestUpdate();

            this.schedule(() => {
                this.matchCards = this.matchCards.map((item, itemIndex) =>
                    itemIndex === firstIndex || itemIndex === index
                        ? { ...item, selected: false, matched: true }
                        : item,
                );
                this.matchPairsFound += 1;
                this.matchSelectedIndex = null;
                this.matchIsAnimating = false;
                this.requestUpdate();

                if (this.matchPairsFound === this.matchTotalPairs) {
                    this.showToast(this.t("toast_memory_finish"));
                    this.schedule(() => this.startMatchGame(this.getLearnedData()), 1000);
                }
            }, 400);
            return;
        }

        this.matchIsAnimating = true;
        this.matchCards = this.matchCards.map((item, itemIndex) => {
            if (itemIndex === firstIndex) {
                return { ...item, selected: false, wrong: true };
            }
            if (itemIndex === index) {
                return { ...item, wrong: true };
            }
            return item;
        });
        this.requestUpdate();

        this.schedule(() => {
            this.matchCards = this.matchCards.map((item, itemIndex) =>
                itemIndex === firstIndex || itemIndex === index ? { ...item, wrong: false } : item,
            );
            this.matchSelectedIndex = null;
            this.matchIsAnimating = false;
            this.requestUpdate();
        }, 600);
    };

    private readonly startReflex = (): void => {
        const learned = this.getLearnedData();
        if (learned.length < 4) {
            this.showToast(this.t("toast_need_4_reflex"));
            return;
        }

        this.reflexActive = true;
        this.reflexScore = 0;
        this.nextReflexRound();
    };

    private readonly stopReflex = (): void => {
        this.clearReflexTimer();
        this.clearReflexBarFrame();
        this.reflexActive = false;
        this.reflexBarAnimating = false;

        if (this.reflexScore > (this.userData.highScore || 0)) {
            this.userData = {
                ...this.userData,
                highScore: this.reflexScore,
            };
            this.persist();
            return;
        }

        this.requestUpdate();
    };

    private nextReflexRound(): void {
        const learned = this.getLearnedData();
        const item = learned[Math.floor(Math.random() * learned.length)];
        if (!item) return;

        const distractors = sampleUnique(this.uniqueRomajiPool(item.romaji), 3);
        this.currentReflexItem = item;
        this.reflexOptions = shuffle([item.romaji, ...distractors]);
        this.reflexTimeLeft = Math.max(1000, 3000 - this.reflexScore * 50);
        this.reflexRoundKey += 1;
        this.reflexBarAnimating = false;

        this.clearReflexTimer();
        this.reflexTimer = window.setTimeout(() => this.gameOverReflex(), this.reflexTimeLeft);
        this.requestUpdate();
        this.startReflexBarAnimation();
    }

    private readonly checkReflexAnswer = (answer: string): void => {
        if (!this.currentReflexItem) return;

        if (answer === this.currentReflexItem.romaji) {
            this.reflexScore += 1;
            this.nextReflexRound();
            return;
        }

        this.gameOverReflex();
    };

    private gameOverReflex(): void {
        this.clearReflexTimer();
        this.showToast(this.t("toast_game_over").replace("{score}", String(this.reflexScore)));
        this.stopReflex();
    }

    private readonly changeLang = (lang: Language): void => {
        if (this.userData.lang === lang) return;
        this.userData = { ...this.userData, lang };
        this.persist();
    };

    private readonly exportData = (): void => {
        downloadJson(`kanamatsu_${Date.now()}.json`, this.userData);
        this.showToast(this.t("toast_export_ok"));
    };

    private readonly openImportDialog = (): void => {
        const input = this.querySelector<HTMLInputElement>("#import-file");
        input?.click();
    };

    private readonly handleImportData = async (event: Event): Promise<void> => {
        const input = event.currentTarget as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        try {
            const imported = await readJsonFile<Partial<UserData>>(file);
            if (!Array.isArray(imported.learnedIds)) {
                this.showToast(this.t("toast_invalid_file"));
                return;
            }

            this.userData = normalizeUserData({
                ...this.userData,
                ...imported,
                learnedIds: imported.learnedIds,
            });
            this.syncLearnSettingsFromUserData();
            this.persist();
            this.showToast(this.t("toast_import_ok"));
        } catch {
            this.showToast(this.t("toast_read_error"));
        } finally {
            input.value = "";
        }
    };

    private readonly openClearDialog = (): void => {
        this.clearDialogOpen = true;
        this.requestUpdate();
    };

    private readonly closeClearDialog = (): void => {
        this.clearDialogOpen = false;
        this.requestUpdate();
    };

    private readonly confirmClearData = (): void => {
        const { theme, font, lang, learnMode, learnBatchSize, includeDakuten, includeYoon, learnReview, learnShuffle } =
            this.userData;
        this.userData = {
            ...DEFAULT_USER_DATA,
            theme,
            font,
            lang,
            learnMode,
            learnBatchSize,
            includeDakuten,
            includeYoon,
            learnReview,
            learnShuffle,
        };
        this.syncLearnSettingsFromUserData();
        this.clearDialogOpen = false;
        this.stopPractice();
        this.stopReflex();
        this.persist();
        this.showToast(this.t("toast_clear_ok"));
    };
}

declare global {
    interface HTMLElementTagNameMap {
        "kana-app": Kanamatsu;
    }
}

if (!customElements.get("kana-app")) {
    customElements.define("kana-app", Kanamatsu);
}
