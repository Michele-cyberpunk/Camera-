import React, { useState, useCallback, useEffect } from 'react';
import { PaletteIcon, UploadIcon, SparklesIcon } from './icons';
import { type ColorPalette, type ExtractedColor } from '../types';
import ColorSwatch from './ColorSwatch';

interface ColorHarmonizationPanelProps {
  onExtract: (file: File, count: number) => void;
  onApplyTransfer: () => void;
  palette: ColorPalette | null;
  selectedColors: ExtractedColor[];
  setSelectedColors: (colors: ExtractedColor[]) => void;
  loadingAction: string | null;
  isDone: boolean;
}

const ColorHarmonizationPanel: React.FC<ColorHarmonizationPanelProps> = ({
  onExtract,
  onApplyTransfer,
  palette,
  selectedColors,
  setSelectedColors,
  loadingAction,
  isDone
}) => {
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [colorCount, setColorCount] = useState<number>(8);
  
  const isExtracting = loadingAction === 'extract';
  const isApplying = loadingAction === 'apply';
  const isBusy = isExtracting || isApplying;

  const handleFileSelect = useCallback((file: File | undefined) => {
    if (file) {
      setReferenceFile(file);
      const url = URL.createObjectURL(file);
      setReferencePreview(url);
    }
  }, []);
  
  useEffect(() => {
    // Cleanup function to revoke the object URL when the component unmounts
    // or when the referencePreview URL changes, to prevent memory leaks.
    return () => {
      if (referencePreview) {
        URL.revokeObjectURL(referencePreview);
      }
    };
  }, [referencePreview]);

  const handleExtractClick = () => {
    if(referenceFile) {
        onExtract(referenceFile, colorCount);
    }
  }

  const handleColorToggle = (color: ExtractedColor) => {
    const isSelected = selectedColors.some(c => c.hex === color.hex);
    if (isSelected) {
      setSelectedColors(selectedColors.filter(c => c.hex !== color.hex));
    } else {
      setSelectedColors([...selectedColors, color]);
    }
  };

  if(isDone) {
    return (
        <div className="flex flex-col justify-center text-center my-auto">
            <h2 className="text-2xl font-bold text-white">Miglioramento Completato</h2>
            <p className="text-gray-400 mt-2">La tua foto è stata migliorata con successo.</p>
        </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-grow space-y-6 overflow-y-auto">
        <h2 className="text-2xl font-bold text-white">3. Armonizzazione Colore</h2>
        
        <div>
            <label htmlFor="ref-file-upload" className="cursor-pointer group">
                <div className={`aspect-video w-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-all ${referencePreview ? 'border-gray-600' : 'border-gray-500 hover:border-gray-400 bg-gray-800/50'}`}>
                    {referencePreview ? (
                        <img src={referencePreview} alt="Reference Preview" className="w-full h-full object-cover rounded-md" />
                    ) : (
                        <>
                            <UploadIcon className="w-10 h-10 text-gray-500 mb-2 group-hover:text-gray-400" />
                            <h3 className="text-md font-semibold text-gray-400 group-hover:text-gray-300">Carica riferimento</h3>
                            <p className="text-xs text-gray-500 mt-1">Trascina o clicca qui</p>
                        </>
                    )}
                </div>
                <input id="ref-file-upload" type="file" className="sr-only" onChange={(e) => handleFileSelect(e.target.files?.[0])} accept="image/jpeg,image/png,image/webp" />
            </label>
            <p className="text-xs text-gray-500 mt-2">Usa un'immagine di riferimento per estrarre la sua palette di colori.</p>
        </div>

        <div className="space-y-3 p-4 bg-gray-800/40 rounded-lg">
            <div className="flex justify-between items-baseline">
                <label className="text-sm font-medium text-gray-300">Numero di Colori</label>
                <span className="text-sm font-mono px-2 py-1 bg-gray-900 rounded-md text-cyan-400">{colorCount}</span>
            </div>
            <input
                type="range" min="4" max="16" value={colorCount}
                onChange={(e) => setColorCount(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-cyan-500"
                disabled={!referenceFile || isBusy}
            />
            <button onClick={handleExtractClick} disabled={!referenceFile || isBusy} className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed">
                 {isExtracting ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Estrazione...
                    </>
                 ) : (
                    <><PaletteIcon className="w-5 h-5 mr-2" /> Estrai Palette</>
                 )}
            </button>
        </div>

        {palette && (
             <div className="space-y-3">
                <h3 className="text-md font-medium text-gray-300">Seleziona i colori da usare:</h3>
                <div className="grid grid-cols-4 gap-3">
                    {palette.colors.map((color) => (
                        <ColorSwatch key={color.hex} color={color} isSelected={selectedColors.some(c => c.hex === color.hex)} onClick={() => handleColorToggle(color)} />
                    ))}
                </div>
             </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-700 space-y-4">
        <button
          onClick={onApplyTransfer}
          disabled={isBusy || selectedColors.length === 0}
          className="w-full flex items-center justify-center px-4 py-3 bg-cyan-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isApplying ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Armonizzazione in corso...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 mr-2" />
              Applica Armonizzazione
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ColorHarmonizationPanel;
