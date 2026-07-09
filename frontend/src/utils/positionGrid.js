/**
 * 從 position 字串（例如 "1A"、"69A"）解析出數字順序。
 * 用來讓不同活動的格子依照相同的數字順序對齊到同一個 grid row。
 *
 * @param {string} position
 * @returns {number|null} 解析失敗回傳 null
 */
export function parsePositionIndex(position) {
  const match = position.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * 掃描指定 event 清單在 cache 中已快取的格子，找出最大的 position 數字。
 * 特殊檢視會用這個數字決定 grid 要留幾列，讓所有長期池活動（不論是否同組）
 * 都用同一份 row 版面，藉此對齊。
 *
 * @param {string[]} eventValues
 * @param {Object} cache - { eventValue: { A: [...cells], B: [...cells] } }
 * @returns {number}
 */
export function computeMaxPositionIndex(eventValues, cache) {
  let max = 0;
  for (const value of eventValues) {
    const columns = cache[value];
    if (!columns) continue;
    for (const cells of Object.values(columns)) {
      for (const cell of cells) {
        const idx = parsePositionIndex(cell.position);
        if (idx !== null && idx > max) max = idx;
      }
    }
  }
  return max;
}
