import { useCallback } from 'react';
import PickCard from './PickCard';
import { getOtherEventsForPosition } from '../utils/eventComparison';

/**
 * @param {{
 *   data: Object,
 *   cache: Object,
 *   events: Array,
 *   currentEvent: string,
 *   allCached: boolean,
 * }} props
 */
export default function ResultColumns({ data, cache, events, currentEvent, allCached }) {
  const columns = Object.keys(data).sort();

  // 產生一個穩定的 lookup 函式傳給 PickCard
  // 只在 allCached 為 true 時才提供（不然資料不完整，不應顯示 tooltip）
  const getTooltipData = useCallback(
    allCached
      ? (position) => getOtherEventsForPosition(position, currentEvent, cache, events)
      : null,
    [allCached, currentEvent, cache, events]
  );

  if (columns.length === 0) {
    return <p className="hint">沒有解析到任何格子，請確認 seed / event 是否正確。</p>;
  }

  return (
    <div className="result-columns">
      {columns.map((column) => (
        <section key={column} className="result-column">
          <h3>欄位 {column}</h3>
          <ul>
            {data[column].map((cell) => (
              <PickCard
                key={cell.position}
                cell={cell}
                getTooltipData={getTooltipData}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
