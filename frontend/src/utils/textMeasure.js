const FONT_FAMILY = '"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif';
// 對應 styles.css 中 .pick-name / .pick-alt 的 font-size（以 16px 為根字體大小換算）
const NAME_FONT = `400 13.12px ${FONT_FAMILY}`;
const ALT_FONT = `400 12.48px ${FONT_FAMILY}`;

const MIN_WIDTH = 96;
const WIDTH_PADDING = 12;

let measureCtx = null;

function getMeasureContext() {
  if (typeof document === 'undefined') return null;
  if (!measureCtx) {
    measureCtx = document.createElement('canvas').getContext('2d');
  }
  return measureCtx;
}

function measureWidth(text, font) {
  const ctx = getMeasureContext();
  if (!ctx || !text) return 0;
  ctx.font = font;
  return ctx.measureText(text).width;
}

/**
 * 掃描 cache 內所有已載入的格子，量測貓咪名稱（含替代名 + redirect）的最大顯示寬度。
 * 用來讓所有 pick-card 的名稱欄位統一成同一個寬度，避免文字換行，也讓整頁版面寬度一致。
 *
 * @param {Object} cache - { eventValue: { A: [...cells], B: [...cells] } }
 * @returns {number} 建議的名稱欄位寬度（px）
 */
export function computeNameColumnWidth(cache) {
  let max = MIN_WIDTH;

  for (const columns of Object.values(cache)) {
    for (const cells of Object.values(columns)) {
      for (const cell of cells) {
        max = Math.max(max, measureWidth(cell.name, NAME_FONT));

        if (cell.alt_name) {
          const altText = `${cell.alt_name} (${cell.redirect})`;
          max = Math.max(max, measureWidth(altText, ALT_FONT));
        }
      }
    }
  }

  return Math.ceil(max + WIDTH_PADDING);
}
