import { useEffect, useState } from 'react';

// 目前先只支援 tw，之後要加其他語言，加進這個陣列就好（不用動表單邏輯）。
const SUPPORTED_LANGS = [{ value: 'tw', label: 'TW（繁體中文）' }];

// 只記「最新一筆」送出過的 seed；用單一固定 key 覆寫，不像瀏覽器原生自動完成會一直累積清單。
const LAST_SEED_KEY = 'bc-godfat:last-seed';

function readLastSeed() {
  try {
    return localStorage.getItem(LAST_SEED_KEY) ?? '';
  } catch {
    // localStorage 被封鎖（例如無痕模式）時，安靜地當作沒有記住的值。
    return '';
  }
}

function writeLastSeed(seed) {
  try {
    localStorage.setItem(LAST_SEED_KEY, seed);
  } catch {
    // 寫入失敗不影響查詢功能本身，安靜忽略即可。
  }
}

/**
 * 手動輸入 seed + 選擇語言的查詢表單。
 * @param {{
 *   seed?: string,
 *   lang?: string,
 *   onSubmit: (query: { seed: string, lang: string }) => void,
 *   loading?: boolean,
 * }} props
 */
export default function SeedQueryForm({ seed: importedSeed, lang: importedLang, onSubmit, loading }) {
  const [seed, setSeed] = useState(importedSeed ?? readLastSeed());
  const [lang, setLang] = useState(importedLang ?? SUPPORTED_LANGS[0].value);

  // 上方「貼網址」解析出新值時，同步帶進這個表單。
  useEffect(() => {
    if (importedSeed) setSeed(importedSeed);
  }, [importedSeed]);

  useEffect(() => {
    if (importedLang) setLang(importedLang);
  }, [importedLang]);

  function handleSubmit(event) {
    event.preventDefault();
    const trimmedSeed = seed.trim();
    if (!trimmedSeed) return;
    writeLastSeed(trimmedSeed);
    onSubmit({ seed: trimmedSeed, lang });
  }

  return (
    <form className="card seed-query-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="seed">Seed</label>
        <input
          id="seed"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="例如 1131802308"
          value={seed}
          onChange={(event) => setSeed(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="lang">介面語言</label>
        <select id="lang" value={lang} onChange={(event) => setLang(event.target.value)}>
          {SUPPORTED_LANGS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={loading || !seed.trim()}>
        {loading ? '查詢中…' : '查詢'}
      </button>
    </form>
  );
}
