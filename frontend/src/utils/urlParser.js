/**
 * 把使用者貼上的 bc.godfat.org 網址解析成 { seed, lang }。
 *
 * 故意不解析 last：對查詢來說不重要，網站本身會自動帶入目前的 last。
 *
 * @param {string} rawUrl
 * @returns {{ seed: string, lang: string } | null} 解析失敗回傳 null
 */
export function parseGodfatUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  const seed = url.searchParams.get('seed');
  if (!seed) {
    return null;
  }

  const lang = url.searchParams.get('lang') ?? 'tw';

  return { seed, lang };
}
