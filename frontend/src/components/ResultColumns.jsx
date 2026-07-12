import { useCallback, useMemo } from 'react';
import PickCard from './PickCard';
import { getMatesForPosition } from '../utils/eventComparison';
import { groupEventsByStartDate } from '../utils/eventDuration';

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

  // 開頭檔期相同的一般池 event 視為同一組，只跟同組比較（跟長期池同一套規則）
  const mates = useMemo(() => {
    const groups = groupEventsByStartDate(events);
    const group = groups.find((g) => g.some((ev) => ev.value === currentEvent)) ?? [];
    return group.filter((ev) => ev.value !== currentEvent);
  }, [events, currentEvent]);

  const matesCached = mates.every((ev) => cache[ev.value]);

  // 只在同組 mates 都快取好時才提供（不用像過去一樣等「全部」event 快取完）
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
