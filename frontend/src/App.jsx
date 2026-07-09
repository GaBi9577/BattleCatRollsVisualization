import { useState } from 'react';
import UrlImportForm from './components/UrlImportForm';
import SeedQueryForm from './components/SeedQueryForm';
import EventSelect from './components/EventSelect';
import ResultColumns from './components/ResultColumns';
import SpecialView from './components/SpecialView';
import { fetchTracks } from './api/godfatApi';
import { splitEventsByDuration } from './utils/eventDuration';
import './styles.css';

const SCREENS = {
  QUERY: 'query',
  EVENT: 'event',
  RESULT: 'result',
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.QUERY);

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

  function handleQuerySubmit(query) {
    setBaseQuery(query);
    setScreen(SCREENS.EVENT);
  }

  // 背景抓取其他 event（靜默失敗，不影響使用者操作）
  async function backgroundFetchRest(primaryValue, currentCache) {
    const remaining = events.filter(
      (ev) => ev.value !== primaryValue && !(ev.value in currentCache)
    );
    for (const ev of remaining) {
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
      // 每個請求間隔 1 秒，避免連發觸發 rate limit
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  async function handleEventSelect(eventValue) {
    setSelectedEvent(eventValue);
    setResultError('');
    setScreen(SCREENS.RESULT);

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
      backgroundFetchRest(eventValue, newCache);
    } catch (err) {
      setResultError(err.message ?? '查詢失敗，請稍後再試。');
    } finally {
      setResultLoading(false);
    }
  }

  // 頁面三切換 event（優先用快取）
  async function handleSwitchEvent(eventValue) {
    setSelectedEvent(eventValue);
    setResultError('');
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
      setResultError(err.message ?? '查詢失敗，請稍後再試。');
    } finally {
      setResultLoading(false);
    }
  }

  const currentData = selectedEvent ? cache[selectedEvent] : null;
  const cachedCount = Object.keys(cache).length;
  const allCached = cachedCount === events.length && events.length > 0;
  const { longTermEvents } = splitEventsByDuration(events);

  return (
    <main className="app">
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
              {/* 活動切換選單 */}
              {events.length > 0 && (
                <div className="field result-event-switcher">
                  <label htmlFor="result-event">活動</label>
                  <select
                    id="result-event"
                    value={selectedEvent ?? ''}
                    onChange={(e) => handleSwitchEvent(e.target.value)}
                  >
                    {events.map((ev) => (
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
                  events={events}
                  currentEvent={selectedEvent}
                  allCached={allCached}
                />
              )}
            </div>

            <SpecialView
              longTermEvents={longTermEvents}
              cache={cache}
              events={events}
              allCached={allCached}
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
