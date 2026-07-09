/**
 * 判斷一個 event 是否為「長期池」（持續時間超過 30 天）。
 *
 * 用來把 EVENT/RESULT 畫面的活動分成一般檢視（左）與特殊檢視（右）。
 * 白金轉蛋、傳說轉蛋這類長期常駐池的結束日期通常設得很遠（例如 2030-01-01），
 * 天數差距一定遠超過 30 天，用簡單的天數相減即可判斷，不需要比對月份或做四捨五入。
 */
const LONG_TERM_THRESHOLD_DAYS = 30;

/**
 * @param {string} dateRange - 例如 "2026-04-24 ~ 2030-01-01"
 * @returns {boolean} 解析失敗時保守回傳 false（視為一般檢視，不會不小心把資料藏到特殊檢視裡）
 */
export function isLongTermEvent(dateRange) {
  if (!dateRange) return false;

  const [startText, endText] = dateRange.split('~').map((part) => part.trim());
  const start = new Date(startText);
  const end = new Date(endText);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > LONG_TERM_THRESHOLD_DAYS;
}

/**
 * 把 events 依持續時間分成一般（normal）與長期（longTerm）兩組，保留原本順序。
 * @param {Array<{date_range: string}>} events
 * @returns {{ normalEvents: Array, longTermEvents: Array }}
 */
export function splitEventsByDuration(events) {
  const normalEvents = [];
  const longTermEvents = [];

  for (const event of events) {
    (isLongTermEvent(event.date_range) ? longTermEvents : normalEvents).push(event);
  }

  return { normalEvents, longTermEvents };
}

/**
 * @param {string} dateRange - 例如 "2026-04-24 ~ 2030-01-01"
 * @returns {string} 起始日期文字（未提供時回傳空字串）
 */
function getStartDateText(dateRange) {
  if (!dateRange) return '';
  const [startText] = dateRange.split('~').map((part) => part.trim());
  return startText;
}

/**
 * 把長期池 events 依「開頭檔期（起始日期）」分組，起始日期相同的歸為同一組。
 * 保留 events 原本的相對順序（依第一次出現的起始日期排序分組）。
 *
 * @param {Array<{ value: string, date_range: string, title: string }>} events
 * @returns {Array<Array>} 分組後的陣列，每個元素是一組 events（長度可能為 1，代表沒有同期活動）
 */
export function groupEventsByStartDate(events) {
  const groupOrder = [];
  const groupsByKey = new Map();

  for (const event of events) {
    const key = getStartDateText(event.date_range);
    if (!groupsByKey.has(key)) {
      groupsByKey.set(key, []);
      groupOrder.push(key);
    }
    groupsByKey.get(key).push(event);
  }

  return groupOrder.map((key) => groupsByKey.get(key));
}
