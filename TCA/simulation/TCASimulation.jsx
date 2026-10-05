import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import './tca-styles.css';
import { EVENTS, T_MAX, clampZoom, buildScene } from "./constants";
import { draw } from "./draw";
import Sidebar from "./Sidebar";
import Controls from "./Controls";
import Stats from "./Stats";
import SimulationCanvas from "./SimulationCanvas";

export default function TCASimulation() {
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const [cur, setCur] = useState(0);
  const [t, setT] = useState(-T_MAX);
  const [playing, setPlaying] = useState(!reduce);
  const [speed, setSpeed] = useState(1);
  const [zoom, setZoom] = useState(1);

  const cvRef = useRef(null);
  const stageRef = useRef(null);
  const size = useRef({ W: 0, H: 0, dpr: 1 });
  const drag = useRef(null);
  const pointers = useRef(new Map()); // active pointers, for pinch zoom
  const pinch = useRef(null);
  // mutable values the animation loop reads every frame
  const view = useRef({
    yaw: 0.7, pitch: 0.55, t: -T_MAX, playing: !reduce, speed: 1,
    zoom: 1, zoomTarget: 1, // zoom eases towards zoomTarget
  });

  const setZoomTo = useCallback((z) => {
    const c = clampZoom(z);
    view.current.zoomTarget = c;
    setZoom(c);
  }, []);
  const zoomBy = useCallback((f) => setZoomTo(view.current.zoomTarget * f), [setZoomTo]);
  const resetView = () => {
    const v = view.current;
    v.yaw = 0.7; v.pitch = 0.55;
    setZoomTo(1);
  };

  const ev = EVENTS[cur] || null;
  const scene = useMemo(() => ev ? buildScene(cur) : null, [cur, ev]);
  const sceneRef = useRef(scene);
  const evRef = useRef(ev);

  useEffect(() => {
    sceneRef.current = scene;
    evRef.current = ev;
    view.current.playing = playing;
    view.current.speed = speed;
  }, [scene, ev, playing, speed]);
  


  const select = (i) => {
    setCur(i);
    view.current.t = -T_MAX;
    setT(-T_MAX);
  };

  // canvas sizing
  useEffect(() => {
    const cv = cvRef.current, stage = stageRef.current;
    const fit = () => {
      const r = stage.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      size.current = { W: r.width, H: r.height, dpr };
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  // animation loop
  useEffect(() => {
    const ctx = cvRef.current.getContext("2d");
    let raf, last = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const v = view.current;
      // smooth zoom
      v.zoom += (v.zoomTarget - v.zoom) * Math.min(1, dt * 12);
      if (Math.abs(v.zoomTarget - v.zoom) < 0.0005) v.zoom = v.zoomTarget;
      if (v.playing) {
        v.t += dt * 0.35 * v.speed;
        if (v.t > T_MAX) v.t = -T_MAX;
        setT(v.t);
      }
      const { W, H, dpr } = size.current;
      draw(ctx, W, H, dpr, v, sceneRef.current, evRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // mouse wheel / trackpad pinch to zoom (needs a non-passive listener to prevent page scroll)
  useEffect(() => {
    const stage = stageRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
      zoomBy(Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0015)));
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  // one pointer drags to rotate, two pointers pinch to zoom
  const onDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [p, q] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(p.x - q.x, p.y - q.y) || 1, zoom: view.current.zoomTarget };
      drag.current = null;
    } else {
      drag.current = { x: e.clientX, y: e.clientY };
    }
  };
  const onMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [p, q] = [...pointers.current.values()];
      setZoomTo((pinch.current.zoom * Math.hypot(p.x - q.x, p.y - q.y)) / pinch.current.d);
      return;
    }
    if (!drag.current) return;
    const v = view.current;
    v.yaw += (e.clientX - drag.current.x) * 0.006;
    v.pitch = Math.max(0.25, Math.min(1.1, v.pitch + (e.clientY - drag.current.y) * 0.004));
    drag.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = (e) => {
    pointers.current.delete(e.pointerId);
    pinch.current = null;
    if (pointers.current.size === 1) {
      const [p] = [...pointers.current.values()];
      drag.current = { x: p.x, y: p.y };
    } else {
      drag.current = null;
    }
  };

  const onScrub = (e) => {
    const val = parseFloat(e.target.value);
    view.current.t = val;
    setT(val);
  };

  const sec = t * 60;
  const range = ev ? Math.hypot(ev.miss / 1000, ev.vel * Math.abs(sec)) : 0;

  const [shapeMode, setShapeMode] = useState('ellipsoid');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  useEffect(() => {
    view.current.shapeMode = shapeMode;
  }, [shapeMode]);

  const toggleFullscreen = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    if (!document.fullscreenElement && !isFullscreen) {
      if (stage.requestFullscreen) {
        stage.requestFullscreen().then(() => {
          setIsFullscreen(true);
        }).catch(() => {
          setIsFullscreen(true);
        });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(() => {
          setIsFullscreen(false);
        });
      } else {
        setIsFullscreen(false);
      }
    }
  }, [isFullscreen]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isFullscreen]);

  const controlsProps = {
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
  };

  if (!ev) {
    return (
      <div className="cw" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#08141c', color: '#7f97a6'}}>
         <h2>No TCA Events Found</h2>
         <p>Run TCA Engine to generate close approach events.</p>
      </div>
    );
  }

  return (
    <div className="cw">
      <header className="cw-head" style={{ display: 'flex', alignItems: 'center' }}>
        <h1 style={{ flex: 1 }}>Conjunction Watch</h1>
        <div>
          <span>{EVENTS.length} events tracked</span>
        </div>
      </header>

      <div className="cw-layout">
        <Sidebar cur={cur} select={select} />
        
        <main className="cw-main">
          <SimulationCanvas 
            stageRef={stageRef}
            cvRef={cvRef}
            onDown={onDown}
            onMove={onMove}
            onUp={onUp}
            isFullscreen={isFullscreen}
            toggleFullscreen={toggleFullscreen}
            controlsProps={controlsProps}
          />

          <Controls
            {...controlsProps}
          />
          <p className="cw-hint">Drag to rotate. Scroll or pinch to zoom.</p>

          <Stats ev={ev} t={t} sec={sec} range={range} />
        </main>
      </div>
    </div>
  );
}
