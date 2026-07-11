const MAX_NAME_LENGTH = 10;

/**
 * 將名稱截斷至最多 maxLength 字，超過用「…」表示。
 * 用於貓咪名稱／替代名顯示，避免格子寬度因名稱長短不一而跳動。
 *
 * @param {string} name
 * @param {number} [maxLength]
 * @returns {string}
 */
export function truncateName(name, maxLength = MAX_NAME_LENGTH) {
  if (!name) return '';
  return name.length > maxLength ? `${name.slice(0, maxLength)}…` : name;
}
