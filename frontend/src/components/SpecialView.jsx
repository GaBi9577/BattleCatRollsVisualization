import { useMemo } from 'react';
import SpecialEventColumns from './SpecialEventColumns';
import { groupEventsByStartDate } from '../utils/eventDuration';
import { getMatesForPosition } from '../utils/eventComparison';
import { computeMaxPositionIndex } from '../utils/positionGrid';

/**
 * 特殊檢視：持續時間超過 30 天的長期池（如白金轉蛋、傳說轉蛋），
 * 每個活動各自一組 A/B column，橫向並排顯示（放不下時橫向捲動）。
 *
 * 開頭檔期（起始日期）相同的活動會被視為同一組：組內逐格比對貓咪名稱，
 * 名字不同時在 tooltip 顯示同組其他活動在該格的貓咪（不限稀有度）。
 *
 * 所有活動共用同一份 row 版面（依 position 數字對齊），讓橫向並排的
 * column 之間可以互相對齊。
 *
 * 資料直接重用 App.jsx 已經抓好的 cache，不會另外呼叫 API。
 *
 * @param {{
 *   longTermEvents: Array<{ value: string, date_range: string, title: string }>,
 *   cache: Object,
 *   planningMode?: boolean,
 *   selectedCells?: Set<string>,
 *   onToggleCell?: (key: string) => void,
 * }} props
 */
// 長期池同檔期會有「傳說」「白金」等多個活動配對，比較邏輯仍要用整組資料，
// 但畫面上只需要顯示白金池，避免同檔期的池子重複塞滿版面。
const DISPLAY_TITLE_KEYWORD = '白金';

export default function SpecialView({
  longTermEvents,
  cache,
  planningMode = false,
  selectedCells,
  onToggleCell,
}) {
  const groups = useMemo(
    () => groupEventsByStartDate(longTermEvents),
    [longTermEvents]
  );

  const maxRows = useMemo(
    () => computeMaxPositionIndex(longTermEvents.map((ev) => ev.value), cache),
    [longTermEvents, cache]
  );

  if (longTermEvents.length === 0) {
    return null;
  }

  return (
    <aside className="special-view">
      <h2>特殊檢視（長期池）</h2>
      <div className="special-view-groups">
        {groups.map((group) => {
          const displayEvents = group.filter((ev) => ev.title.includes(DISPLAY_TITLE_KEYWORD));
          if (displayEvents.length === 0) {
            return null;
          }

          return (
            <div key={group.map((ev) => ev.value).join('|')} className="special-group">
              {displayEvents.map((event) => {
                const data = cache[event.value];
                const mates = group.filter((ev) => ev.value !== event.value);
                const matesCached = mates.every((ev) => cache[ev.value]);
                // 注意：這裡故意沒有像 ResultColumns.jsx 一樣包 useCallback——
                // 這段是在 .map() 迴圈裡逐一產生每個活動各自的 getTooltipData，
                // hooks 規則不允許在迴圈/條件式裡呼叫，包了會違規。
                // 而且目前 PickCard.jsx／SpecialEventColumns.jsx 都沒有用
                // React.memo，就算包了 useCallback 也不會真的省到重新渲染，
                // 所以這裡刻意維持現狀，不是漏做。
                const getTooltipData =
                  mates.length > 0 && matesCached
                    ? (position) => getMatesForPosition(position, mates, cache)
                    : null;

                return (
                  <div key={event.value} className="special-event-wrap">
                    {data ? (
                      <SpecialEventColumns
                        event={event}
                        data={data}
                        maxRows={maxRows}
                        getTooltipData={getTooltipData}
                        planningMode={planningMode}
                        selectedCells={selectedCells}
                        onToggleCell={onToggleCell}
                      />
                    ) : (
                      <p className="hint">背景載入中…</p>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
