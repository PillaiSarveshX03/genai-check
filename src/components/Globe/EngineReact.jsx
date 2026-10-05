import React, { useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { geoTo3D } from '../../utils/geoTo3D';
import CameraControls from '../Controls/CameraControls';

const getDefaultView = (width) => ({ lat: 23.5, lng: 80, altitude: width < 768 ? 3.5 : 1.675 });
const ZOOM_STEP = 0.5;
const MIN_ALTITUDE = 0.1;
const ANIMATION_MS = 500;
const RESET_ANIMATION_MS = 1000;

export default function EngineReact({ processedSatData, selectedSatId, setSelectedSatId, hoveredSatId, setHoveredSatId, dimensions, calculatePosition }) {
    const globeEl = useRef();
    const ringRefs = useRef({});
    const dotRefs = useRef({});

    useEffect(() => {
        if (!globeEl.current) return;

        const controls = globeEl.current.controls();
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.enableZoom = true;

        globeEl.current.pointOfView(getDefaultView(dimensions.width));
    }, []);

    // Inject orbit rings AND satellite dots directly into Three.js scene
    useEffect(() => {
        if (!globeEl.current) return;
        const scene = globeEl.current.scene();

        // Clean up old objects
        Object.values(ringRefs.current).forEach(obj => scene.remove(obj));
        Object.values(dotRefs.current).forEach(obj => scene.remove(obj));
        ringRefs.current = {};
        dotRefs.current = {};

        processedSatData.forEach(sat => {
            // --- ORBIT RING ---
            const ringPoints = [];
            if (sat.rawPathPoints) {
                sat.rawPathPoints.forEach(p => {
                    const coords = globeEl.current.getCoords(p.lat, p.lng, p.alt);
                    ringPoints.push(new THREE.Vector3(coords.x, coords.y, coords.z));
                });
            } else {
                for (let t = 0; t <= 360; t += 3) {
                    const pos = calculatePosition(sat.inc, sat.raan, t);
                    const coords = globeEl.current.getCoords(pos.lat, pos.lng, sat.alt);
                    ringPoints.push(new THREE.Vector3(coords.x, coords.y, coords.z));
                }
            }

            const ringGeometry = new THREE.BufferGeometry().setFromPoints(ringPoints);
            const ringMaterial = new THREE.LineBasicMaterial({
                color: 0x686262ff,
                transparent: false
            });
            const ring = new THREE.LineLoop(ringGeometry, ringMaterial);
            scene.add(ring);
            ringRefs.current[sat.id] = ring;

            // --- SATELLITE DOT ---
            const dotGeometry = new THREE.SphereGeometry(0.6, 12, 12);
            const dotMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff
            });
            const dot = new THREE.Mesh(dotGeometry, dotMaterial);
            const satPos = globeEl.current.getCoords(sat.lat, sat.lng, sat.alt);
            dot.position.set(satPos.x, satPos.y, satPos.z);
            scene.add(dot);
            dotRefs.current[sat.id] = dot;
        });

        return () => {
            Object.values(ringRefs.current).forEach(obj => {
                const s = globeEl.current?.scene();
                if (s) s.remove(obj);
            });
            Object.values(dotRefs.current).forEach(obj => {
                const s = globeEl.current?.scene();
                if (s) s.remove(obj);
            });
        };
    }, [processedSatData, calculatePosition]);

    // Update colors when selection or hover changes
    useEffect(() => {
        if (!globeEl.current) return;

        Object.entries(ringRefs.current).forEach(([id, ring]) => {
            const isSelected = String(id) === String(selectedSatId);
            const isHovered = String(id) === String(hoveredSatId);
            const active = isSelected || isHovered;

            ring.material.color.setHex(active ? 0x8b5cf6 : 0x555555);
            ring.material.transparent = active;
            ring.material.opacity = active ? (isSelected ? 0.8 : 0.5) : 1.0;
        });

        Object.entries(dotRefs.current).forEach(([id, dot]) => {
            const isSelected = String(id) === String(selectedSatId);
            const isHovered = String(id) === String(hoveredSatId);
            const active = isSelected || isHovered;

            dot.material.color.setHex(active ? 0x8b5cf6 : 0xffffff);
            dot.scale.setScalar(isSelected ? 2 : isHovered ? 1.5 : 1);
        });

        if (selectedSatId) {
            const sat = processedSatData.find(s => String(s.id) === String(selectedSatId));
            if (sat) {
                globeEl.current.pointOfView({
                    lat: sat.lat,
                    lng: sat.lng,
                    altitude: 0.8
                }, ANIMATION_MS);
            }
        }
    }, [selectedSatId, hoveredSatId, processedSatData]);

    // Handle clicks and hovers on the globe — raycast to detect satellite dot intersections
    useEffect(() => {
        if (!globeEl.current) return;
        const renderer = globeEl.current.renderer();
        const camera = globeEl.current.camera();
        const raycaster = new THREE.Raycaster();
        raycaster.params.Mesh = { threshold: 2 };
        const mouse = new THREE.Vector2();

        // Use a ref to throttle hover updates if necessary, but simple raycast is usually fast enough
        let currentHovered = null;

        const handleMouseMove = (event) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            const dots = Object.values(dotRefs.current);
            const intersects = raycaster.intersectObjects(dots);

            if (intersects.length > 0) {
                const hitDot = intersects[0].object;
                const satId = Object.entries(dotRefs.current).find(([, d]) => d === hitDot)?.[0];
                if (satId !== currentHovered) {
                    currentHovered = satId;
                    setHoveredSatId(satId);
                    document.body.style.cursor = 'pointer';
                }
            } else {
                if (currentHovered !== null) {
                    currentHovered = null;
                    setHoveredSatId(null);
                    document.body.style.cursor = 'grab';
                }
            }
        };

        const handleClick = (event) => {
            if (currentHovered) {
                setSelectedSatId(currentHovered);
            }
        };

        renderer.domElement.addEventListener('mousemove', handleMouseMove);
        renderer.domElement.addEventListener('click', handleClick);

        return () => {
            renderer.domElement.removeEventListener('mousemove', handleMouseMove);
            renderer.domElement.removeEventListener('click', handleClick);
            document.body.style.cursor = 'default';
        };
    }, [processedSatData, setSelectedSatId, setHoveredSatId]);

    const zoomIn = () => {
        if (!globeEl.current) return;
        const pov = globeEl.current.pointOfView();
        globeEl.current.pointOfView(
            { ...pov, altitude: Math.max(MIN_ALTITUDE, pov.altitude - ZOOM_STEP) },
            ANIMATION_MS
        );
    };

    const zoomOut = () => {
        if (!globeEl.current) return;
        const pov = globeEl.current.pointOfView();
        globeEl.current.pointOfView(
            { ...pov, altitude: pov.altitude + ZOOM_STEP },
            ANIMATION_MS
        );
    };

    const resetView = () => {
        if (!globeEl.current) return;
        globeEl.current.pointOfView(getDefaultView(dimensions.width), RESET_ANIMATION_MS);
        setSelectedSatId(null);
    };

    return (
        <>
            <div className="mc-globe">
                <Globe
                    ref={globeEl}
                    width={dimensions.width}
                    height={dimensions.height}
                    globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                    bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
                    backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"
                    atmosphereColor="#3a228a"
                    atmosphereAltitude={0.15}
                />
            </div>

            <CameraControls zoomIn={zoomIn} zoomOut={zoomOut} resetView={resetView} />
        </>
    );
}
