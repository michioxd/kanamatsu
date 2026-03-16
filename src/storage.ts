import { DEFAULT_USER_DATA, STORAGE_KEY } from "./data";
import type { LearnMode, UserData } from "./types";

const VALID_LEARN_MODES = new Set<LearnMode>(["hiragana", "katakana", "both"]);

export function normalizeUserData(input?: Partial<UserData>): UserData {
    const parsed = input ?? {};

    return {
        ...DEFAULT_USER_DATA,
        ...parsed,
        learnedIds: Array.isArray(parsed.learnedIds) ? parsed.learnedIds : DEFAULT_USER_DATA.learnedIds,
        highScore: typeof parsed.highScore === "number" ? parsed.highScore : DEFAULT_USER_DATA.highScore,
        learnMode: VALID_LEARN_MODES.has(parsed.learnMode as LearnMode)
            ? (parsed.learnMode as LearnMode)
            : DEFAULT_USER_DATA.learnMode,
        learnBatchSize:
            typeof parsed.learnBatchSize === "number" && Number.isFinite(parsed.learnBatchSize)
                ? parsed.learnBatchSize
                : DEFAULT_USER_DATA.learnBatchSize,
        includeDakuten:
            typeof parsed.includeDakuten === "boolean" ? parsed.includeDakuten : DEFAULT_USER_DATA.includeDakuten,
        includeYoon: typeof parsed.includeYoon === "boolean" ? parsed.includeYoon : DEFAULT_USER_DATA.includeYoon,
        learnReview: typeof parsed.learnReview === "boolean" ? parsed.learnReview : DEFAULT_USER_DATA.learnReview,
        learnShuffle: typeof parsed.learnShuffle === "boolean" ? parsed.learnShuffle : DEFAULT_USER_DATA.learnShuffle,
    };
}

export function loadUserData(): UserData {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
        return normalizeUserData();
    }

    try {
        const parsed = JSON.parse(saved) as Partial<UserData>;
        return normalizeUserData(parsed);
    } catch {
        return normalizeUserData();
    }
}

export function saveUserData(userData: UserData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
}
