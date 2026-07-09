import ResultColumns from './ResultColumns';

/**
 * 特殊檢視：持續時間超過 30 天的長期池（如白金轉蛋、傳說轉蛋），
 * 全部攤開並排顯示，方便互相比較，不受左側單一活動切換的影響。
 *
 * 資料直接重用 App.jsx 已經抓好的 cache，不會另外呼叫 API。
 *
 * @param {{
 *   longTermEvents: Array<{ value: string, date_range: string, title: string }>,
 *   cache: Object,
 *   events: Array,
 *   allCached: boolean,
 * }} props
 */
export default function SpecialView({ longTermEvents, cache, events, allCached }) {
  if (longTermEvents.length === 0) {
    return null;
  }

  return (
    <aside className="special-view">
      <h2>特殊檢視（長期池）</h2>
      {longTermEvents.map((ev) => {
        const data = cache[ev.value];
        return (
          <section key={ev.value} className="special-view-event">
            <h3>{ev.date_range}：{ev.title}</h3>
            {data ? (
              <ResultColumns
                data={data}
                cache={cache}
                events={events}
                currentEvent={ev.value}
                allCached={allCached}
              />
            ) : (
              <p className="hint">背景載入中…</p>
            )}
          </section>
        );
      })}
    </aside>
  );
}
