import PickCard from './PickCard';
import { parsePositionIndex } from '../utils/positionGrid';

/**
 * 特殊檢視內，單一長期池活動的 A/B 欄位區塊。
 *
 * 每個格子依照 position 的數字順序放進固定的 grid row（缺格的位置留空但保留列高），
 * 讓不同活動、不同 column 之間的列可以互相對齊 —— maxRows 由 SpecialView
 * 統一計算並傳入，確保所有長期池活動（不論是否同組）都套用同一份 row 版面。
 *
 * @param {{
 *   event: { value: string, date_range: string, title: string },
 *   data: Object,                                    // { A: [...cells], B: [...cells] }
 *   maxRows: number,
 *   getTooltipData: ((position: string) => Array) | null,
 * }} props
 */
export default function SpecialEventColumns({ event, data, maxRows, getTooltipData }) {
  const columns = Object.keys(data).sort();
  const rows = maxRows > 0 ? maxRows : 1;
  const rowIndexes = Array.from({ length: rows }, (_, i) => i + 1);

  const columnMaps = columns.map((column) => {
    const map = new Map();
    for (const cell of data[column]) {
      const idx = parsePositionIndex(cell.position);
      if (idx !== null) map.set(idx, cell);
    }
    return { column, map };
  });

  return (
    <section className="special-event">
      <h3 className="special-event-title">{event.date_range}：{event.title}</h3>
      <div
        className="special-event-grid"
        style={{ gridTemplateRows: `auto repeat(${rows}, auto)` }}
      >
        {columnMaps.map(({ column }, colIdx) => (
          <span
            key={`label-${column}`}
            className="special-event-col-label"
            style={{ gridColumn: colIdx + 1, gridRow: 1 }}
          >
            欄位 {column}
          </span>
        ))}

        {columnMaps.map(({ column, map }, colIdx) =>
          rowIndexes.map((rowIdx) => {
            const cell = map.get(rowIdx);
            const gridStyle = { gridColumn: colIdx + 1, gridRow: rowIdx + 1 };

            if (!cell) {
              return (
                <span
                  key={`${column}-${rowIdx}-empty`}
                  className="special-event-cell-empty"
                  style={gridStyle}
                />
              );
            }

            return (
              <PickCard
                key={cell.position}
                cell={cell}
                getTooltipData={getTooltipData}
                alwaysShowTooltip
                style={gridStyle}
              />
            );
          })
        )}
      </div>
    </section>
  );
}
