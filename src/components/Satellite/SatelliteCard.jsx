
import React from 'react';

export default function SatelliteCard({ satellite, onClose }) {
    if (!satellite) return null;

    const lat = satellite.isRealistic ? satellite.current?.[0] : satellite.lat;
    const lng = satellite.isRealistic ? satellite.current?.[1] : satellite.lng;
    const alt = satellite.isRealistic ? satellite.current?.[2] : (satellite.alt * 6371);

    const inc = satellite.isRealistic ? null : satellite.inc;
    const raan = satellite.isRealistic ? null : satellite.raan;
    const period = satellite.isRealistic ? satellite.orbit?.period_min : null;
    const perigee = satellite.isRealistic ? satellite.orbit?.perigee_km : null;
    const apogee = satellite.isRealistic ? satellite.orbit?.apogee_km : null;

    const formatNumber = (value, decimals = 2) => {
        return value != null ? Number(value).toFixed(decimals) : 'N/A';
    };

    return (
        <div className="absolute top-[65%] left-1/2 -translate-x-1/2 -translate-y-1/2 md:top-[80px] md:left-auto md:right-6 md:translate-x-0 md:translate-y-0 w-[calc(100vw-32px)] md:w-80 max-w-[400px] bg-gray-900/90 backdrop-blur-md border border-violet-500/40 rounded-lg p-4 z-40 text-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.5)] pointer-events-auto">

            {/* Header */}
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-white/10">
                <div>
                    <h2 className="text-sm font-bold tracking-widest text-white m-0 leading-tight">
                        {satellite.name}
                    </h2>

                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">
                        NORAD {satellite.id}
                    </p>
                    
                    {!satellite.isRealistic && satellite.intlDes && (
                        <p className="text-[9px] text-gray-500 mt-1 font-mono">
                            {satellite.intlDes}
                        </p>
                    )}
                </div>

                {onClose && (
                    <button
                        className="bg-transparent border-none text-gray-400 text-lg cursor-pointer leading-none px-1 hover:text-white transition-colors"
                        onClick={onClose}
                    >
                        ×
                    </button>
                )}
            </div>

            {/* Current Position */}
            <div className="mb-4">
                <div className="text-[9px] text-violet-400 uppercase tracking-widest mb-2">
                    CURRENT POSITION
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-gray-500 uppercase tracking-wider">
                            Latitude
                        </span>

                        <span className="text-xs font-mono text-gray-200 mt-1">
                            {formatNumber(lat, 3)}°
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[9px] text-gray-500 uppercase tracking-wider">
                            Longitude
                        </span>

                        <span className="text-xs font-mono text-gray-200 mt-1">
                            {formatNumber(lng, 3)}°
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[9px] text-gray-500 uppercase tracking-wider">
                            Altitude
                        </span>

                        <span className="text-xs font-mono text-emerald-400 mt-1">
                            {formatNumber(alt, 1)} km
                        </span>
                    </div>
                </div>
            </div>

            {/* Orbital Parameters */}
            <div className="mb-4">
                <div className="text-[9px] text-violet-400 uppercase tracking-widest mb-2">
                    ORBITAL PARAMETERS
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {/* Only show these if they exist */}
                    {inc != null && (
                        <div className="flex flex-col">
                            <span className="text-[9px] text-gray-500 uppercase tracking-wider">Inclination</span>
                            <span className="text-xs font-mono text-gray-200 mt-1">{formatNumber(inc, 2)}°</span>
                        </div>
                    )}
                    {raan != null && (
                        <div className="flex flex-col">
                            <span className="text-[9px] text-gray-500 uppercase tracking-wider">RAAN</span>
                            <span className="text-xs font-mono text-gray-200 mt-1">{formatNumber(raan, 2)}°</span>
                        </div>
                    )}
                    {period != null && (
                        <div className="flex flex-col">
                            <span className="text-[9px] text-gray-500 uppercase tracking-wider">Period</span>
                            <span className="text-xs font-mono text-gray-200 mt-1">{formatNumber(period, 2)} min</span>
                        </div>
                    )}
                    {perigee != null && (
                        <div className="flex flex-col">
                            <span className="text-[9px] text-gray-500 uppercase tracking-wider">Perigee</span>
                            <span className="text-xs font-mono text-gray-200 mt-1">{formatNumber(perigee, 1)} km</span>
                        </div>
                    )}
                    {apogee != null && (
                        <div className="flex flex-col">
                            <span className="text-[9px] text-gray-500 uppercase tracking-wider">Apogee</span>
                            <span className="text-xs font-mono text-gray-200 mt-1">{formatNumber(apogee, 1)} km</span>
                        </div>
                    )}
                    
                    {/* Normal mode specific fields */}
                    {!satellite.isRealistic && satellite.org && (
                         <div className="flex flex-col">
                            <span className="text-[9px] text-gray-500 uppercase tracking-wider">Operator</span>
                            <span className="text-xs font-mono text-gray-200 mt-1">{satellite.org}</span>
                        </div>
                    )}
                    {!satellite.isRealistic && satellite.type && (
                         <div className="flex flex-col">
                            <span className="text-[9px] text-gray-500 uppercase tracking-wider">Type</span>
                            <span className="text-xs font-mono text-gray-200 mt-1">{satellite.type}</span>
                        </div>
                    )}
                    {!satellite.isRealistic && satellite.value && (
                         <div className="flex flex-col">
                            <span className="text-[9px] text-gray-500 uppercase tracking-wider">Asset Value</span>
                            <span className="text-xs font-mono text-gray-200 mt-1">{satellite.value}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


