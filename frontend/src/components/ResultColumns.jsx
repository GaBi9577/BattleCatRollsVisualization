import { useCallback, useMemo } from 'react';
import PickCard from './PickCard';
import { getMatesForPosition } from '../utils/eventComparison';

/**
 * @param {{
 *   data: Object,
 *   cache: Object,
 *   events: Array,        // 一般池 events（不含長期池，由 App.jsx 先分好）
 *   currentEvent: string,
 * }} props
 */
export default function ResultColumns({ data, cache, events, currentEvent }) {
  const columns = Object.keys(data).sort();

  // 一般池規則：同組（normalEvents）裡所有活動皆為比較對象，不再依開頭檔期分組
  const mates = useMemo(
    () => events.filter((ev) => ev.value !== currentEvent),
    [events, currentEvent]
  );

  const matesCached = mates.every((ev) => cache[ev.value]);

  // 一般池所有活動都快取好才提供 tooltip 資料（mates 現在就是「全部其他一般池活動」）
  const getTooltipData = useCallback(
    mates.length > 0 && matesCached
      ? (position) => getMatesForPosition(position, mates, cache)
      : null,
    [mates, matesCached, cache]
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
