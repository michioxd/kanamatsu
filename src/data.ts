import type { UserData } from "./types";

export const STORAGE_KEY = "kanamatsu";

export const DEFAULT_USER_DATA: UserData = {
    learnedIds: [],
    highScore: 0,
    theme: "auto",
    font: "noto",
    lang: navigator.language.startsWith("vi") ? "vi" : "en",
    learnMode: "both",
    learnBatchSize: 5,
    includeDakuten: false,
    includeYoon: false,
    learnReview: false,
    learnShuffle: false,
};

export const APP_VERSION = "0.1";
