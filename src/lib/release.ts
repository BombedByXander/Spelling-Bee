export const RELEASE_YEAR = 2026;
export const RELEASE_WEEK = 9;
export const RELEASE_REVISION = 8;

const YEAR_SHORT = String(RELEASE_YEAR).slice(-2);
const WEEK_PAD = String(RELEASE_WEEK).padStart(2, "0");

export const RELEASE_VERSION = `${YEAR_SHORT}.${WEEK_PAD}.${RELEASE_REVISION}`;
export const RELEASE_STORAGE_TOKEN = `${RELEASE_YEAR}_${WEEK_PAD}_${RELEASE_REVISION}`;

export const UPDATE_POPUP_NEVER_KEY = `spelldown-update-${RELEASE_STORAGE_TOKEN}-never`;
export const UPDATE_POPUP_SESSION_DISMISSED_KEY = `spelldown-update-${RELEASE_VERSION}-dismissed-session`;
