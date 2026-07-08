const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8742';

/**
 * 拿 Upcoming 活動清單（{ value, date_range, title }[]）。
 */
export async function fetchUpcomingEvents({ lang }) {
  const params = new URLSearchParams({ lang });
  const response = await fetch(`${API_BASE}/api/events?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`活動清單查詢失敗（${response.status}）`);
  }

  return response.json();
}

/**
 * 用 seed + event + lang 查詢轉蛋格子資料（已依 A/B 分組）。
 */
export async function fetchTracks({ seed, event, lang }) {
  const params = new URLSearchParams({ seed, event, lang });
  const response = await fetch(`${API_BASE}/api/tracks?${params.toString()}`);

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? `查詢失敗（${response.status}）`);
  }

  return response.json();
}
