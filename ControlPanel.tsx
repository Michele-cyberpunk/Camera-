import React from 'react';
import { SparklesIcon } from './icons';

interface ControlPanelProps {
  dodge: number;
  setDodge: (value: number) => void;
  burn: number;
  setBurn: (value: number) => void;
  lightingStyle: string;
  setLightingStyle: (value: string) => void;
  creativePrompt: string;
  setCreativePrompt: (value: string) => void;
  onProcess: () => void;
  loadingAction: string | null;
}

const Slider = ({ label, value, setValue }: { label: string, value: number, setValue: (value: number) => void }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-baseline">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <span className="text-sm font-mono px-2 py-1 bg-gray-900 rounded-md text-cyan-400">{value}%</span>
    </div>
    <input
      type="range"
      min="0"
      max="100"
      value={value}
      onChange={(e) => setValue(parseInt(e.target.value))}
      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
    />
  </div>
);


const ControlPanel: React.FC<ControlPanelProps> = ({ 
    dodge, setDodge, burn, setBurn, 
    lightingStyle, setLightingStyle,
    creativePrompt, setCreativePrompt,
    onProcess, loadingAction 
}) => {
  const lightingOptions = ["Standard", "Cinematico", "Rembrandt", "Contrasto Morbido", "Drammatico"];
  const isLoading = loadingAction === 'dodge_burn';

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-grow space-y-8">
        <h2 className="text-2xl font-bold text-white">2. Ritocco Luce &amp; Stile</h2>
        
        <Slider label="Intensità Scherma" value={dodge} setValue={setDodge} />
        <Slider label="Intensità Brucia" value={burn} setValue={setBurn} />

        <div className="space-y-2">
            <label htmlFor="lighting-style" className="text-sm font-medium text-gray-300">Stile di Illuminazione</label>
            <select
                id="lighting-style"
                value={lightingStyle}
                onChange={(e) => setLightingStyle(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"
            >
                {lightingOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
        </div>

        <div className="space-y-2">
            <label htmlFor="creative-prompt" className="text-sm font-medium text-gray-300">Guida Creativa (opzionale)</label>
            <textarea
                id="creative-prompt"
                rows={3}
                value={creativePrompt}
                onChange={(e) => setCreativePrompt(e.target.value)}
                placeholder='Es: "rendila più drammatica", "uno stile da film noir"...'
                className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 resize-y"
            />
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <button
          onClick={onProcess}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-3 bg-cyan-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Elaborazione in corso...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 mr-2" />
              Applica Ritocco Luce
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;