import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import UrlImportForm from './components/UrlImportForm';
import SeedQueryForm from './components/SeedQueryForm';
import EventSelect from './components/EventSelect';
import ResultColumns from './components/ResultColumns';
import SpecialView from './components/SpecialView';
import { fetchTracks } from './api/godfatApi';
import { splitEventsByDuration } from './utils/eventDuration';
import { readTheme, writeTheme } from './utils/theme';
import './styles.css';

const SCREENS = {
  QUERY: 'query',
  EVENT: 'event',
  RESULT: 'result',
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.QUERY);

  // 黑暗模式：初始值讀 localStorage 記住的上次選擇，切換時同步寫回。
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      writeTheme(next);
      return next;
    });
  }

  // 規劃模式：只在本次瀏覽有效，重新整理就清空，不寫 localStorage。
  // 標記單位是單一格子，key 用 `${eventValue}-${column}-${position}` 識別。
  const [planningMode, setPlanningMode] = useState(false);
  const [selectedCells, setSelectedCells] = useState(() => new Set());

  const toggleCell = useCallback((key) => {
    setSelectedCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  function clearAllSelections() {
    setSelectedCells(new Set());
  }

  // 頁面一
  const [imported, setImported] = useState(null);
  const [baseQuery, setBaseQuery] = useState(null); // { seed, lang }

  // 頁面二
  const [events, setEvents] = useState([]); // 完整活動清單，從 EventSelect 取得

  // 頁面三
  const [selectedEvent, setSelectedEvent] = useState(null); // 目前顯示的 event value
  const [cache, setCache] = useState({});    // { eventValue: tracks_data }
  const [resultLoading, setResultLoading] = useState(false);
  const [resultError, setResultError] = useState('');
  // 記錄「使用者目前實際想看的 event」，非同步回應回來時用來判斷是否已過時。
  const activeEventRef = useRef(null);
  // 背景抓取的世代編號，每次重新啟動就 +1，讓舊迴圈偵測到後自行停止，避免重入。
  const backgroundFetchGenRef = useRef(0);

  function handleQuerySubmit(query) {
    setBaseQuery(query);
    setScreen(SCREENS.EVENT);
  }

  // 背景抓取其他 event（靜默失敗，不影響使用者操作）
  async function backgroundFetchRest(primaryValue, currentCache) {
    // 啟動新一輪背景抓取時世代 +1；舊迴圈偵測到世代不符就自行停止，
    // 避免兩條背景抓取迴圈同時打 bc.godfat.org。
    const myGen = ++backgroundFetchGenRef.current;
    const remaining = events.filter(
      (ev) => ev.value !== primaryValue && !(ev.value in currentCache)
    );
    for (const ev of remaining) {
      if (backgroundFetchGenRef.current !== myGen) return;
      try {
        const data = await fetchTracks({
          seed: baseQuery.seed,
          lang: baseQuery.lang,
          event: ev.value,
        });
        setCache((prev) => ({ ...prev, [ev.value]: data }));
      } catch {
        // 背景失敗靜默忽略，之後切換到該 event 時再重試
      }
      if (backgroundFetchGenRef.current !== myGen) return;
      // 每個請求間隔 1 秒，避免連發觸發 rate limit
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  async function handleEventSelect(eventValue) {
    setSelectedEvent(eventValue);
    setResultError('');
    setScreen(SCREENS.RESULT);
    activeEventRef.current = eventValue;

    // 已有快取就不重抓
    if (cache[eventValue]) {
      backgroundFetchRest(eventValue, cache);
      return;
    }

    setResultLoading(true);
    try {
      const data = await fetchTracks({
        seed: baseQuery.seed,
        lang: baseQuery.lang,
        event: eventValue,
      });
      const newCache = { ...cache, [eventValue]: data };
      setCache(newCache);
      // 使用者若在等待期間已經切到別的 event，這批快取仍然有用，
      // 但不該再由這次請求觸發背景抓取（避免跟新的一輪重複）。
      if (activeEventRef.current === eventValue) {
        backgroundFetchRest(eventValue, newCache);
      }
    } catch (err) {
      if (activeEventRef.current === eventValue) {
        setResultError(err.message ?? '查詢失敗，請稍後再試。');
      }
    } finally {
      // 只有「目前仍是使用者想看的 event」才更新 loading 狀態，
      // 避免舊請求晚回來把畫面誤設回不 loading。
      if (activeEventRef.current === eventValue) {
        setResultLoading(false);
      }
    }
  }

  // 頁面三切換 event（優先用快取）
  async function handleSwitchEvent(eventValue) {
    setSelectedEvent(eventValue);
    setResultError('');
    activeEventRef.current = eventValue;
    if (cache[eventValue]) return;

    setResultLoading(true);
    try {
      const data = await fetchTracks({
        seed: baseQuery.seed,
        lang: baseQuery.lang,
        event: eventValue,
      });
      setCache((prev) => ({ ...prev, [eventValue]: data }));
    } catch (err) {
      if (activeEventRef.current === eventValue) {
        setResultError(err.message ?? '查詢失敗，請稍後再試。');
      }
    } finally {
      if (activeEventRef.current === eventValue) {
        setResultLoading(false);
      }
    }
  }

  const currentData = selectedEvent ? cache[selectedEvent] : null;
  const cachedCount = Object.keys(cache).length;
  const { normalEvents, longTermEvents } = useMemo(
    () => splitEventsByDuration(events),
    [events]
  );

  return (
    <main className={`app${screen === SCREENS.RESULT ? ' app--result' : ''}`}>
      <div className="top-toolbar">
        <button type="button" className="secondary" onClick={toggleTheme}>
          {theme === 'dark' ? '☀️ 亮色' : '🌙 深色'}
        </button>

        {screen === SCREENS.RESULT && (
          <>
            <button
              type="button"
              className={planningMode ? '' : 'secondary'}
              onClick={() => setPlanningMode((prev) => !prev)}
            >
              {planningMode ? '結束規劃' : '規劃模式'}
            </button>
            {planningMode && (
              <>
                <span className="planning-count">已選 {selectedCells.size} 格</span>
                <button type="button" className="secondary" onClick={clearAllSelections}>
                  清除全部
                </button>
              </>
            )}
          </>
        )}
      </div>

      <h1>Battle Cats 轉蛋查詢</h1>

      {screen === SCREENS.QUERY && (
        <>
          <p className="subtitle">貼上網址，或直接輸入 seed 來查詢轉蛋結果</p>
          <UrlImportForm onParsed={setImported} />
          <SeedQueryForm
            seed={imported?.seed}
            lang={imported?.lang}
            onSubmit={handleQuerySubmit}
          />
        </>
      )}

      {screen === SCREENS.EVENT && (
        <EventSelect
          lang={baseQuery.lang}
          onSelect={handleEventSelect}
          onBack={() => setScreen(SCREENS.QUERY)}
          onEventsLoaded={setEvents}
        />
      )}

      {screen === SCREENS.RESULT && (
        <section className="card result-section">
          <div className="result-body">
            <div className="result-normal">
              {/* 活動切換選單：只列一般池，長期池自動顯示在右側，不能從這裡選 */}
              {normalEvents.length > 0 && (
                <div className="field result-event-switcher">
                  <label htmlFor="result-event">活動</label>
                  <select
                    id="result-event"
                    value={selectedEvent ?? ''}
                    onChange={(e) => handleSwitchEvent(e.target.value)}
                  >
                    {normalEvents.map((ev) => (
                      <option key={ev.value} value={ev.value}>
                        {cache[ev.value] ? '✓ ' : ''}
                        {ev.date_range}：{ev.title}
                      </option>
                    ))}
                  </select>
                  {cachedCount < events.length && (
                    <p className="hint">
                      背景載入中… {cachedCount} / {events.length}
                    </p>
                  )}
                </div>
              )}

              {resultLoading && <p className="hint">查詢中…</p>}
              {resultError && <p className="form-error">{resultError}</p>}
              {currentData && (
                <ResultColumns
                  data={currentData}
                  cache={cache}
                  events={normalEvents}
                  currentEvent={selectedEvent}
                  planningMode={planningMode}
                  selectedCells={selectedCells}
                  onToggleCell={toggleCell}
                />
              )}
            </div>

            <SpecialView
              longTermEvents={longTermEvents}
              cache={cache}
              planningMode={planningMode}
              selectedCells={selectedCells}
              onToggleCell={toggleCell}
            />
          </div>

          <button type="button" className="secondary" onClick={() => setScreen(SCREENS.EVENT)}>
            上一頁
          </button>
        </section>
      )}
    </main>
  );
}
