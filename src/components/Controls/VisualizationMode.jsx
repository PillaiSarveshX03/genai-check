import React from 'react';

export default function VisualizationMode({ engine, setEngine, dataMode, setDataMode, setCesiumLoading, onModeChange }) {
    return (
        <div className="flex flex-col gap-2 md:ml-6 mt-1 md:mt-0">
            <div className="flex border border-gray-700 rounded overflow-hidden">
                <button 
                    className={`px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-mono transition-colors ${engine === 'react' ? 'bg-[#5a8fba] text-white' : 'bg-transparent text-gray-500 hover:text-gray-300'}`}
                    onClick={() => { 
                        setEngine('react'); 
                        setCesiumLoading(false); 
                        if(onModeChange) onModeChange();
                    }}
                >
                    REACT
                </button>
                <button 
                    className={`px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-mono transition-colors ${engine === 'cesium' ? 'bg-[#5a8fba] text-white' : 'bg-transparent text-gray-500 hover:text-gray-300'}`}
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
            {dataMode && setDataMode && (
                <div className="flex border border-gray-700 rounded overflow-hidden">
                    <button 
                        className={`px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-mono transition-colors ${dataMode === 'normal' ? 'bg-[#5a8fba] text-white' : 'bg-transparent text-gray-500 hover:text-gray-300'}`}
                        onClick={() => { 
                            setDataMode('normal'); 
                            if(onModeChange) onModeChange();
                        }}
                    >
                        NORMAL VIEW
                    </button>
                    <button 
                        className={`px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-mono transition-colors ${dataMode === 'realistic' ? 'bg-[#5a8fba] text-white' : 'bg-transparent text-gray-500 hover:text-gray-300'}`}
                        onClick={() => { 
                            setDataMode('realistic'); 
                            if(onModeChange) onModeChange();
                        }}
                    >
                        REALISTIC VIEW
                    </button>
                </div>
            )}
        </div>
    );
}
