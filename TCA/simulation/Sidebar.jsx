import { EVENTS, RISK, fmtDist } from './constants';

export default function Sidebar({ cur, select }) {
  return (
    <aside className="cw-side">
      <h2>Upcoming close approaches</h2>
      {EVENTS.map((e, i) => (
        <button
          key={`${e.a}-${e.b}-${i}`}
          type="button"
          className="cw-ev"
          aria-pressed={i === cur}
          onClick={() => select(i)}
        >
          <div className="cw-pair">
            {e.a} <i>and</i> {e.b}
            {e.retroB && <span className="cw-retro" style={{ marginLeft: 6 }}>↺</span>}
          </div>
          <div className="cw-meta" style={{ alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span 
                className="cw-dot" 
                style={{ 
                  background: RISK[e.risk].color, 
                  boxShadow: `0 0 10px ${RISK[e.risk].color}99`,
                  width: 9,
                  height: 9
                }} 
              />
              <span style={{ color: RISK[e.risk].color, fontWeight: 600 }}>
                {fmtDist(e.miss)}
              </span> miss
            </span>
            <span style={{ 
              fontSize: 10, 
              padding: '2px 6px', 
              borderRadius: 4, 
              background: `${RISK[e.risk].color}18`, 
              color: RISK[e.risk].color,
              border: `1px solid ${RISK[e.risk].color}40`,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              {RISK[e.risk].label}
            </span>
          </div>
          <div className="cw-meta" style={{ marginTop: 4, fontSize: 12 }}>
            <span style={{ opacity: 0.85 }}>{e.when}</span>
            <span style={{ fontSize: 11, opacity: 0.65 }}>{e.geometry}</span>
          </div>
        </button>
      ))}
    </aside>
  );
}

