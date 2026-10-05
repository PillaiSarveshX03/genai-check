import React, { useState, useRef, useEffect } from 'react';
import ImportModal from './ImportModal';

export default function Navbar({ 
    engine, 
    setEngine, 
    dataMode, 
    setDataMode, 
    setCesiumLoading, 
    onModeChange,
    trackedObjectsCount,
    satellites,
    setSelectedSatId
}) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="mc-panel relative">
            <div className="mc-panel-section">
                <span className="mc-sys-id">
                    SUDHARSHAN CHAKRA
                    <span className="mc-separator">—</span>
                    <span className="mc-version">MISSION CONTROL v1.0</span>
                </span>
                
                {/* Engine Mode Toggle */}
                <div className="inline-flex items-center h-7 border border-gray-700/80 rounded bg-[#0d0f17] overflow-hidden p-0.5 shrink-0">
                    <button 
                        className={`w-[68px] h-full text-[11px] font-mono tracking-wider transition-colors rounded-sm flex items-center justify-center whitespace-nowrap font-medium ${engine === 'react' ? 'bg-[#5a8fba] text-white shadow-sm' : 'bg-transparent text-gray-400 hover:text-gray-200'}`}
                        onClick={() => { 
                            setEngine('react'); 
                            setCesiumLoading(false); 
                            if(onModeChange) onModeChange();
                        }}
                    >
                        REACT
                    </button>
                    <button 
                        className={`w-[68px] h-full text-[11px] font-mono tracking-wider transition-colors rounded-sm flex items-center justify-center whitespace-nowrap font-medium ${engine === 'cesium' ? 'bg-[#5a8fba] text-white shadow-sm' : 'bg-transparent text-gray-400 hover:text-gray-200'}`}
                        onClick={() => { 
                            if (engine !== 'cesium') {
                                setCesiumLoading(true);
                                setEngine('cesium'); 
                            }
                            if(onModeChange) onModeChange();
                        }}
                    >
                        CESIUM
                    </button>
                </div>

                {/* Data Mode Toggle */}
                {dataMode && setDataMode && (
                    <div className="inline-flex items-center h-7 border border-gray-700/80 rounded bg-[#0d0f17] overflow-hidden p-0.5 shrink-0">
                        <button 
                            className={`w-[110px] h-full text-[11px] font-mono tracking-wider transition-colors rounded-sm flex items-center justify-center whitespace-nowrap font-medium ${dataMode === 'normal' ? 'bg-[#5a8fba] text-white shadow-sm' : 'bg-transparent text-gray-400 hover:text-gray-200'}`}
                            onClick={() => { 
                                setDataMode('normal'); 
                                if(onModeChange) onModeChange();
                            }}
                        >
                            NORMAL VIEW
                        </button>
                        <button 
                            className={`w-[110px] h-full text-[11px] font-mono tracking-wider transition-colors rounded-sm flex items-center justify-center whitespace-nowrap font-medium ${dataMode === 'realistic' ? 'bg-[#5a8fba] text-white shadow-sm' : 'bg-transparent text-gray-400 hover:text-gray-200'}`}
                            onClick={() => { 
                                setDataMode('realistic'); 
                                if(onModeChange) onModeChange();
                            }}
                        >
                            REALISTIC VIEW
                        </button>
                        <button 
                            className={`w-[110px] h-full text-[11px] font-mono tracking-wider transition-colors rounded-sm flex items-center justify-center whitespace-nowrap font-medium ${dataMode === 'tca' ? 'bg-[#5a8fba] text-white shadow-sm' : 'bg-transparent text-gray-400 hover:text-gray-200'}`}
                            onClick={() => { 
                                setDataMode('tca'); 
                                if(onModeChange) onModeChange();
                            }}
                        >
                            TCA VIEW
                        </button>
                    </div>
                )}
            </div>

            <div className="mc-panel-section relative flex items-center gap-3 shrink-0" ref={dropdownRef}>
                {dataMode === 'realistic' && (
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="h-7 px-3 border border-violet-500/50 bg-violet-500/15 text-violet-300 hover:bg-violet-500/30 hover:text-white rounded text-[11px] font-mono transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                        <span className="text-xs">⟳</span> IMPORT TLE
                    </button>
                )}

                <span 
                    className="mc-readout cursor-pointer hover:text-white transition-colors flex items-center gap-1 text-[11px] font-mono whitespace-nowrap"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    TRACKED OBJECTS: <span className="mc-readout-value font-semibold text-white ml-0.5">{trackedObjectsCount}</span>
                    <span className="text-[9px] ml-1 text-gray-400">{isDropdownOpen ? '▲' : '▼'}</span>
                </span>
                <span className="mc-readout-divider text-gray-700 mx-1">|</span>
                <span className="mc-status text-[11px] font-mono whitespace-nowrap flex items-center gap-1.5">
                    <span className="mc-status-dot" />
                    SYSTEM NOMINAL
                </span>

                {/* Dropdown Menu */}
                {isDropdownOpen && satellites && (
                    <div 
                        className="absolute top-full right-0 mt-2 w-72 max-h-96 overflow-y-auto bg-[#0d121d]/98 backdrop-blur-xl border border-violet-500/50 rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-[99999] p-2 text-left"
                        style={{ pointerEvents: 'auto' }}
                    >
                        <div className="text-[10px] font-mono font-semibold text-violet-400 uppercase tracking-widest mb-2 px-2 pb-1 border-b border-violet-500/20 flex justify-between items-center">
                            <span>TRACKED SATELLITES</span>
                            <span className="text-gray-400 font-normal">({satellites.length})</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            {satellites.map(sat => (
                                <button
                                    key={sat.id}
                                    type="button"
                                    className="text-left px-2.5 py-1.5 hover:bg-violet-500/25 rounded text-xs font-mono text-gray-300 hover:text-white transition-colors flex justify-between items-center group cursor-pointer"
                                    onClick={() => {
                                        if (setSelectedSatId) setSelectedSatId(sat.id);
                                        setIsDropdownOpen(false);
                                     }}
                                >
                                    <span className="truncate pr-2 font-medium">{sat.name}</span>
                                    <span className="text-[9px] text-gray-400 group-hover:text-violet-300 whitespace-nowrap">NORAD {sat.id}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ImportModal 
                isOpen={showImportModal} 
                onClose={() => setShowImportModal(false)} 
            />
        </div>
    );
}
