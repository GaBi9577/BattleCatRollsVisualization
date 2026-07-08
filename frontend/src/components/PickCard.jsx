import { useState } from 'react';
import { groupTooltipByName } from '../utils/eventComparison';

const RARITY_STYLES = {
  normal:     { label: '普通',             bg: 'transparent', text: '#9499a6' },
  rare:       { label: '稀有',             bg: 'transparent', text: '#9499a6' },
  supa:       { label: '超稀有',           bg: '#2e2b00',     text: '#FFD700' },
  supa_fest:  { label: '超稀有（限定）',   bg: '#2e1c00',     text: '#FFA500' },
  uber:       { label: '超激稀有',         bg: '#2e0808',     text: '#FF3333' },
  uber_fest:  { label: '超激稀有（限定）', bg: '#2e1200',     text: '#FF6B35' },
  exclusive:  { label: '限定',             bg: '#002a2e',     text: '#00FFFF' },
  found:      { label: '尋獲',             bg: '#002e10',     text: '#00FF7F' },
  legend:     { label: '傳說稀有',         bg: '#2a0030',     text: '#FF00FF' },
};

const FALLBACK = { label: null, bg: 'transparent', text: '#9499a6' };

const TOOLTIP_RARITIES = new Set(['legend', 'uber', 'uber_fest']);

/**
 * @param {{
 *   cell: Object,
 *   getTooltipData?: (position: string) => { event: Object, cell: Object|null }[] | null
 * }} props
 */
export default function PickCard({ cell, getTooltipData }) {
  const [hovered, setHovered] = useState(false);

  const s = RARITY_STYLES[cell.rarity] ?? FALLBACK;
  const label = s.label ?? cell.rarity;
  const hasAlt = !!cell.alt_name;

  const showTooltip = hovered && TOOLTIP_RARITIES.has(cell.rarity) && !!getTooltipData;
  const groups = showTooltip ? groupTooltipByName(getTooltipData(cell.position)) : null;

  return (
    <li
      className="pick-card"
      style={{ background: s.bg }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="pick-left">
        <span className="pick-position" style={{ color: s.text }}>{cell.position}</span>
        <span className="pick-rarity"   style={{ color: s.text }}>{label}</span>
      </div>

      <div className={`pick-right${hasAlt ? '' : ' pick-right--centered'}`}>
        <span className="pick-name">{cell.name}</span>
        {hasAlt && (
          <span className="pick-alt">
            {cell.alt_name}
            <span className="pick-redirect"> ({cell.redirect})</span>
          </span>
        )}
      </div>

      {/* Tooltip：貓咪名稱在上，event 在下，同名合併 */}
      {showTooltip && groups && groups.length > 0 && (
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
