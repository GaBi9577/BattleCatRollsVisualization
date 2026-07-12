/**
 * 給定一個 position，從 cache 撈出「同組」其他 event 在該位置的 cell。
 * 「同組」由呼叫端決定（一般池／長期池都是依開頭檔期分組，見 eventDuration.js
 * 的 groupEventsByStartDate），不限稀有度，一般池／長期池共用同一套規則。
 *
 * @param {string} position    - 例如 "1A"
 * @param {Array}  mateEvents  - 同組的其他 event（不含自己），[{ value, date_range, title }, ...]
 * @param {Object} cache       - { eventValue: { A: [...cells], B: [...cells] } }
 * @returns {{ event: Object, cell: Object|null }[]}
 */
export function getMatesForPosition(position, mateEvents, cache) {
  const column = position.slice(-1); // "A" 或 "B"

  return mateEvents.map((event) => {
    const columnData = cache[event.value]?.[column] ?? [];
    const cell = columnData.find((c) => c.position === position) ?? null;
    return { event, cell };
  });
}

/**
 * 把比較結果依貓咪名稱分組，同名的 event 合併在一起；只保留跟目前格子
 * 貓咪名稱「不同」的項目 —— 這是「這格是否有得比較」的唯一判斷依據，
 * 一般池／長期池共用同一套規則，不再另外限制稀有度。
 *
 * 輸入：[{ event: { date_range, title, ... }, cell: PickCell|null }, ...]
 * 輸出：[{ name: string, labels: string[] }, ...]
 *   - name：貓咪名稱（或 "（無）"，代表該 event 這個 position 沒有格子）
 *   - labels：完整 event 標籤（date_range：title），保留原始順序
 *
 * @param {{ event: Object, cell: Object|null }[]} rows
 * @param {string} currentName - 目前格子的貓咪名稱，用來過濾掉相同名稱的項目
 */
export function groupTooltipByName(rows, currentName) {
  const map = new Map();
  for (const { event, cell } of rows) {
    const name = cell ? cell.name : '（無）';
    if (name === currentName) continue; // 名稱相同，不算「有差異」，不列入 tooltip

    const label = `${event.date_range}：${event.title}`;
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(label);
  }
  return Array.from(map.entries()).map(([name, labels]) => ({ name, labels }));
}
