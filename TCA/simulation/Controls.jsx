import { mmss, ZOOM_MIN, ZOOM_MAX, MONO, T_MAX } from './constants';

export default function Controls({ 
  playing, 
  setPlaying, 
  t, 
  onScrub, 
  speed, 
  setSpeed, 
  sec, 
  zoom, 
  zoomBy, 
  resetView, 
  shapeMode, 
  setShapeMode,
  isFullscreen,
  toggleFullscreen
}) {
  return (
    <div className="cw-controls">
      <button type="button" onClick={() => setPlaying((p) => !p)}>{playing ? "Pause" : "Play"}</button>
      <input
        type="range" min={-T_MAX} max={T_MAX} step="0.01" value={t}
        onChange={onScrub} aria-label="Time relative to closest approach"
      />
      <select value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} aria-label="Playback speed">
        <option value="0.5">0.5x</option>
        <option value="1">1x</option>
        <option value="2">2x</option>
      </select>
      <select value={shapeMode} onChange={(e) => setShapeMode(e.target.value)} aria-label="Shape mode">
        <option value="ellipsoid">Ellipsoid</option>
        <option value="cuboid">Cuboid</option>
      </select>
      <span className="cw-clock">{t < 0 ? "T-" : "T+"}{mmss(sec)}</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <button
          type="button" aria-label="Zoom out" title="Zoom out"
          disabled={zoom <= ZOOM_MIN + 0.001} onClick={() => zoomBy(1 / 1.25)}
        >−</button>
        <span style={{ fontFamily: MONO, fontSize: 12, minWidth: 42, textAlign: "center" }}>
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button" aria-label="Zoom in" title="Zoom in"
          disabled={zoom >= ZOOM_MAX - 0.001} onClick={() => zoomBy(1.25)}
        >+</button>
        <button type="button" aria-label="Reset view" title="Reset zoom and rotation" onClick={resetView}>Reset</button>
        {toggleFullscreen && (
          <button 
            type="button" 
            aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen Simulation"} 
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Simulation Window"} 
            onClick={toggleFullscreen}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "0 10px" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {isFullscreen ? (
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
              ) : (
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              )}
            </svg>
            <span>{isFullscreen ? "Exit" : "Fullscreen"}</span>
          </button>
        )}
      </span>
    </div>
  );
}
