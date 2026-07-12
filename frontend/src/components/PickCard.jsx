import { useMemo, useState } from 'react';
import { groupTooltipByName } from '../utils/eventComparison';
import { truncateName } from '../utils/textTruncate';
import { darken } from '../utils/color';

const RARITY_STYLES = {
  normal:     { label: '普通',             bg: 'transparent', text: '#9499a6' },
  rare:       { label: '稀有',             bg: 'transparent', text: '#9499a6' },
  supa:       { label: '超稀有',           bg: '#FFD700',     text: '#1a1a1a' },
  supa_fest:  { label: '超稀有（限定）',   bg: '#FFFF00',     text: '#1a1a1a' },
  uber:       { label: '超激稀有',         bg: '#FF0000',     text: '#1a1a1a' },
  uber_fest:  { label: '超激稀有（限定）', bg: '#FA8072',     text: '#1a1a1a' },
  exclusive:  { label: '限定',             bg: '#00FFFF',     text: '#1a1a1a' },
  found:      { label: '尋獲',             bg: '#002e10',     text: '#00FF7F' },
  legend:     { label: '傳說稀有',         bg: '#9400D3',     text: '#1a1a1a' },
};

const FALLBACK = { label: null, bg: 'transparent', text: '#9499a6' };

// 有 tooltip 內容時，格子背景加深的比例（比照稀有度原色加深，不換色）
const HIGHLIGHT_DARKEN_AMOUNT = 0.1;

/**
 * @param {{
 *   cell: Object,
 *   getTooltipData?: (position: string) => { event: Object, cell: Object|null }[] | null,
 *   style?: Object,
 * }} props
 */
export default function PickCard({ cell, getTooltipData, style }) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false); // 點擊 + 符號釘住 tooltip（手機無 hover 時使用）

  const s = RARITY_STYLES[cell.rarity] ?? FALLBACK;
  const label = s.label ?? cell.rarity;
  const hasAlt = !!cell.alt_name;

  // 同組內只要有其他 event 在這個位置的貓咪名稱不同，就代表「這格有得比較」；
  // 不限稀有度，一般池／長期池共用同一套規則。這個判斷要隨時算好（不只 hover 時），
  // 因為常駐高亮外框不需要 hover 就要顯示。
  const groups = useMemo(() => {
    if (!getTooltipData) return [];
    return groupTooltipByName(getTooltipData(cell.position), cell.name);
  }, [getTooltipData, cell.position, cell.name]);

  const hasContent = groups.length > 0;
  const showTooltip = hasContent && (hovered || pinned);
  const background = hasContent ? darken(s.bg, HIGHLIGHT_DARKEN_AMOUNT) : s.bg;

  return (
    <li
      className="pick-card"
      style={{ background, color: s.text, ...style }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="pick-left">
        <span className="pick-position">{cell.position}</span>
        <span className="pick-rarity">{label}</span>
      </div>

      <div className={`pick-right${hasAlt ? '' : ' pick-right--centered'}`}>
        <span className="pick-name" title={cell.name}>{truncateName(cell.name)}</span>
        {hasAlt && (
          <span className="pick-alt" style={{ color: s.text }} title={cell.alt_name}>
            {truncateName(cell.alt_name)}
            <span className="pick-redirect" style={{ color: s.text, opacity: 0.7 }}> ({cell.redirect})</span>
          </span>
        )}
      </div>

      {/* 有得比較的格子才顯示：右緣 + 符號，點擊可釘住 tooltip（給沒有 hover 的手機用） */}
      {hasContent && (
        <button
          type="button"
          className="pick-flag"
          style={{ color: s.text }}
          onClick={(e) => {
            e.stopPropagation();
            setPinned((prev) => !prev);
          }}
          aria-label="顯示其他活動的比較結果"
        >
          +
        </button>
      )}

      {/* Tooltip：貓咪名稱在上，event 在下，同名合併；飄在格子正下方，直接覆蓋不避讓 */}
      {showTooltip && (
        <ul className="pick-tooltip">
          {groups.map(({ name, labels }) => (
            <li key={name} className="tooltip-group">
              <span className="tooltip-name">{name}</span>
              {labels.map((label) => (
                <span key={label} className="tooltip-event">{label}</span>
              ))}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
