import React, { useState, useMemo } from 'react';
import * as Cesium from 'cesium';
import satData from '../../data/satellites.json';
import realisticSatData from '../../../orbital-engine/output/satellites.json';
import EngineCesium from './EngineCesium';
import EngineReact from './EngineReact';
import SatelliteCard from '../Satellite/SatelliteCard';
import Navbar from '../Controls/Navbar';
import { calculatePosition } from '../../utils/satelliteHelpers';
import TCASimulation from '../../../TCA/simulation/TCASimulation';

const EARTH_RADIUS = 6371000;

export default function GlobeView() {
  const [selectedSatId, setSelectedSatId] = useState(null);
  const [hoveredSatId, setHoveredSatId] = useState(null);
  const [engine, setEngine] = useState('react'); // 'react' or 'cesium'
  const [dataMode, setDataMode] = useState('normal'); // 'normal' or 'realistic'
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [cesiumLoading, setCesiumLoading] = useState(false);

  React.useEffect(() => {
    const onResize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Pre-calculate satellite positions and full orbit paths
  const processedSatData = useMemo(() => {
    if (dataMode === 'realistic') {
      return realisticSatData.map(sat => {
        const currentPos = Cesium.Cartesian3 ? Cesium.Cartesian3.fromDegrees(sat.current[1], sat.current[0], sat.current[2] * 1000) : null;
        const pathCoords = Cesium.Cartesian3 ? sat.orbit.points.map(p => Cesium.Cartesian3.fromDegrees(p[1], p[0], p[2] * 1000)) : [];
        const rawPathPoints = sat.orbit.points.map(p => ({ lat: p[0], lng: p[1], alt: p[2] / 6371.0 })); 
        // Note: react-globe.gl uses normalized alt (alt / earth radius), so if alt is in km, we convert to alt/6371 to match normal mode's 'alt' scale, OR wait, in normal mode 'alt' is e.g. 0.08. 
        // Actually, realistic alt is ~400km, so 400 / 6371000? No, normal alt is 0.08 which means 0.08 Earth radii.
        // So realistic alt in km divided by 6378.135 km. Let's use 6371 to be consistent with EARTH_RADIUS.

        return {
          ...sat,
          lat: sat.current[0],
          lng: sat.current[1],
          alt: sat.current[2] / 6371.0, // Normalized altitude for Three.js
          currentPos: currentPos,
          pathCoords: pathCoords,
          rawPathPoints: sat.orbit.points.map(p => ({ lat: p[0], lng: p[1], alt: p[2] / 6371.0 })),
          isRealistic: true
        };
      });
    }

    // Normal mode
    return satData.map(sat => {
      // Current position of the satellite
      const pos = calculatePosition(sat.inc, sat.raan, sat.theta);
      let satPosition;
      try {
        satPosition = Cesium.Cartesian3.fromDegrees(pos.lng, pos.lat, sat.alt * EARTH_RADIUS);
      } catch (e) {
        // Fallback if Cesium fails to load/initialize
      }
      
      // Generate full orbit path (360 degrees)
      const pathPositions = [];
      for (let t = 0; t <= 360; t += 5) {
        const point = calculatePosition(sat.inc, sat.raan, t);
        if (Cesium.Cartesian3) {
          pathPositions.push(Cesium.Cartesian3.fromDegrees(point.lng, point.lat, sat.alt * EARTH_RADIUS));
        }
      }

      return {
        ...sat,
        lat: pos.lat,
        lng: pos.lng,
        currentPos: satPosition,
        pathCoords: pathPositions
      };
    });
  }, [dataMode]);

  const activeSat = useMemo(() => {
    return processedSatData.find(s => String(s.id) === String(selectedSatId || hoveredSatId)) || null;
  }, [selectedSatId, hoveredSatId, processedSatData]);

  const onModeChange = () => {
    setSelectedSatId(null);
    setHoveredSatId(null);
  };

  return (
    <div className="mc-root">
      
      {/* Instrument Panel */}
      <Navbar 
         engine={engine} 
         setEngine={setEngine} 
         dataMode={dataMode}
         setDataMode={setDataMode}
         setCesiumLoading={setCesiumLoading} 
         onModeChange={onModeChange}
         trackedObjectsCount={processedSatData.length}
         satellites={processedSatData}
         setSelectedSatId={setSelectedSatId}
      />

      {/* Satellite Info Card */}
      <SatelliteCard satellite={activeSat} onClose={() => { setSelectedSatId(null); setHoveredSatId(null); }} />

      {/* Engines */}
      {dataMode === 'tca' ? (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, background: '#08151d', paddingTop: '60px' }}>
          <TCASimulation />
        </div>
      ) : engine === 'cesium' ? (
        <EngineCesium 
          processedSatData={processedSatData} 
          selectedSatId={selectedSatId} 
          setSelectedSatId={setSelectedSatId} 
          hoveredSatId={hoveredSatId}
          setHoveredSatId={setHoveredSatId}
          onReady={() => setCesiumLoading(false)}
        />
      ) : (
        <EngineReact 
          processedSatData={processedSatData} 
          selectedSatId={selectedSatId} 
          setSelectedSatId={setSelectedSatId}
          hoveredSatId={hoveredSatId}
          setHoveredSatId={setHoveredSatId}
          dimensions={dimensions}
          calculatePosition={calculatePosition}
        />
      )}

      {/* Internal Loader (e.g. for Cesium transition) */}
      <div 
        className="mc-initial-loader-wrapper"
        style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: '#000000', display: 'flex', justifyContent: 'center', alignItems: 'center',
          flexDirection: 'column', gap: '24px', fontFamily: 'monospace', color: '#5a8fba',
          zIndex: 9999, transition: 'opacity 0.5s ease-in-out',
          opacity: cesiumLoading ? 1 : 0,
          pointerEvents: cesiumLoading ? 'all' : 'none'
        }}
      >
        <div className="mc-spinner" style={{
          width: '48px', height: '48px', border: '2px solid rgba(90, 143, 186, 0.2)',
          borderRadius: '50%', borderTopColor: '#5a8fba', borderRightColor: '#5a8fba',
          animation: 'mc-spin 1s linear infinite'
        }}></div>
        <div className="mc-loading-text" style={{
          letterSpacing: '3px', fontSize: '12px', animation: 'mc-pulse 2s ease-in-out infinite'
        }}>POWERING UP CESIUM ENGINE...</div>
      </div>

    </div>
  );
}
