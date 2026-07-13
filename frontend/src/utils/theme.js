// 記住使用者上次選擇的主題（'light' / 'dark'），用單一固定 key 覆寫。
const THEME_KEY = 'bc-godfat:theme';

// 網站原本的設計就是深色主題，所以「沒記住過」時預設 dark，維持既有使用者第一次看到的畫面不變。
const DEFAULT_THEME = 'dark';

export function readTheme() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : DEFAULT_THEME;
  } catch {
    // localStorage 被封鎖（例如無痕模式）時，安靜地回傳預設值。
    return DEFAULT_THEME;
  }
}

export function writeTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // 寫入失敗不影響切換主題本身，安靜忽略即可。
  }
}
