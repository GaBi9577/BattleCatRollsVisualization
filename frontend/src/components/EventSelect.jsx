import { useEffect, useState } from 'react';
import { fetchUpcomingEvents } from '../api/godfatApi';

/**
 * 第 2 畫面：選擇要模擬的活動（event）。
 * @param {{
 *   lang: string,
 *   onSelect: (eventValue: string) => void,
 *   onBack: () => void,
 *   onEventsLoaded: (events: Array) => void,
 * }} props
 */
export default function EventSelect({ lang, onSelect, onBack, onEventsLoaded }) {
  const [events, setEvents] = useState([]);
  const [selectedValue, setSelectedValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchUpcomingEvents({ lang });
        if (cancelled) return;
        setEvents(data);
        setSelectedValue(data[0]?.value ?? '');
        onEventsLoaded?.(data);
      } catch (err) {
        if (!cancelled) setError(err.message ?? '活動清單載入失敗。');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadEvents();
    return () => { cancelled = true; };
  }, [lang]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!selectedValue) return;
    onSelect(selectedValue);
  }

  return (
    <form className="card event-select-form" onSubmit={handleSubmit}>
      <h2>選擇要模擬的活動</h2>

      {loading && <p className="hint">活動清單載入中…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && (
        <div className="field">
          <label htmlFor="event">活動</label>
          <select
            id="event"
            value={selectedValue}
            onChange={(e) => setSelectedValue(e.target.value)}
          >
            {events.map((ev) => (
              <option key={ev.value} value={ev.value}>
                {ev.date_range}：{ev.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="button-row">
        <button type="button" className="secondary" onClick={onBack}>
          上一頁
        </button>
        <button type="submit" disabled={loading || !!error || !selectedValue}>
          開始查詢
        </button>
      </div>
    </form>
  );
}
