/**
 * 給定一個 position（例如 "1A"），從 cache 撈出其他 event 在該位置的 cell。
 *
 * @param {string} position           - 例如 "1A"
 * @param {string} currentEventValue  - 目前顯示的 event，排除自己
 * @param {Object} cache              - { eventValue: { A: [...cells], B: [...cells] } }
 * @param {Array}  events             - [{ value, date_range, title }, ...]
 * @returns {{ event: Object, cell: Object|null }[]}
 */
export function getOtherEventsForPosition(position, currentEventValue, cache, events) {
  const column = position.slice(-1); // "A" 或 "B"

  return events
    .filter((ev) => ev.value !== currentEventValue)
    .map((ev) => {
      const columnData = cache[ev.value]?.[column] ?? [];
      const cell = columnData.find((c) => c.position === position) ?? null;
      return { event: ev, cell };
    });
}

/**
 * 把 getOtherEventsForPosition 的結果依貓咪名稱分組，同名的 event 合併在一起。
 *
 * 輸入：[{ event: { date_range, title, ... }, cell: PickCell|null }, ...]
 * 輸出：[{ name: string, labels: string[] }, ...]
 *   - name：貓咪名稱（或 "（無）"）
 *   - labels：完整 event 標籤（date_range：title），保留原始順序
 */
export function groupTooltipByName(rows) {
  const map = new Map();
  for (const { event, cell } of rows) {
    const name = cell ? cell.name : '（無）';
    const label = `${event.date_range}：${event.title}`;
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(label);
  }
  return Array.from(map.entries()).map(([name, labels]) => ({ name, labels }));
}
