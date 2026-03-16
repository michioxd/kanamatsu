export type Language = "vi" | "en";
export type ThemeMode = "auto" | "light" | "dark";
export type FontMode = "default" | "noto";
export type KanaType = "hiragana" | "katakana";
export type LearnMode = KanaType | "both";
export type PracticeMode = "quiz" | "writing" | "match" | "memory";
export type PageId = "learn" | "practice" | "reflex" | "list" | "settings";

export interface LearnSettings {
    learnMode: LearnMode;
    learnBatchSize: number;
    includeDakuten: boolean;
    includeYoon: boolean;
    learnReview: boolean;
    learnShuffle: boolean;
}

export interface KanaItem {
    id: string;
    kana: string;
    romaji: string;
    type: KanaType;
    isDakuten?: boolean;
    isYoon?: boolean;
}

export interface MemoryCardState {
    id: string;
    text: string;
    revealed: boolean;
    matched: boolean;
}

export interface MatchCardState {
    id: string;
    text: string;
    isKana: boolean;
    matched: boolean;
    selected: boolean;
    wrong: boolean;
}

export interface UserData extends LearnSettings {
    learnedIds: string[];
    highScore: number;
    theme: ThemeMode;
    font: FontMode;
    lang: Language;
}
