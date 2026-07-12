/**
 * 將 hex 顏色加深指定比例（往黑色方向混合），用於標示「有 tooltip 內容」的格子。
 *
 * `transparent` 或非 hex 格式的顏色（例如 normal/rare 稀有度目前沒有真實色碼）
 * 無法計算加深，原樣回傳，避免產生無意義的顏色字串。
 *
 * @param {string} hex     - 例如 "#FFD700"，也接受 "transparent"
 * @param {number} amount  - 加深比例，0～1（例如 0.1 = 加深 10%）
 * @returns {string}
 */
export function darken(hex, amount) {
  if (!hex || !hex.startsWith('#') || hex.length !== 7) return hex;

  const num = parseInt(hex.slice(1), 16);
  const r = Math.round(((num >> 16) & 0xff) * (1 - amount));
  const g = Math.round(((num >> 8) & 0xff) * (1 - amount));
  const b = Math.round((num & 0xff) * (1 - amount));

  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
