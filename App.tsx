import React, { useState, useCallback } from 'react';
import { type ImageState, type ColorPalette, type ExtractedColor } from './types';
import ImageUploader from './components/ImageUploader';
import ControlPanel from './components/ControlPanel';
import ImageViewer from './components/ImageViewer';
import { CameraIcon } from './components/icons';
import { generateEnhancedImage, extractColorsFromImage, applyColorTransfer, suggestDodgeAndBurn } from './services/geminiService';
import ColorHarmonizationPanel from './components/ColorHarmonizationPanel';

type ProcessingStep = 'upload' | 'dodge_burn' | 'harmonization' | 'done';
type LoadingAction = 'dodge_burn' | 'extract' | 'apply' | 'suggest' | null;

const stepsConfig = [
  { id: 'upload', name: 'Passo 1: Carica' },
  { id: 'dodge_burn', name: 'Passo 2: Ritocco' },
  { id: 'harmonization', name: 'Passo 3: Colore' },
];

const Stepper: React.FC<{ currentStep: ProcessingStep }> = ({ currentStep }) => {
  const currentStepIndex = stepsConfig.findIndex(step => {
    if (currentStep === 'done') return step.id === 'harmonization';
    return step.id === currentStep;
  });

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex space-x-4">
        {stepsConfig.map((step, stepIdx) => (
          <li key={step.name} className="flex-1">
            <div className={`flex flex-col border-t-4 pt-2 ${stepIdx <= currentStepIndex ? 'border-cyan-600' : 'border-gray-600'}`}>
              <span className={`text-sm font-medium ${stepIdx <= currentStepIndex ? 'text-cyan-500' : 'text-gray-500'}`}>{step.name}</span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

const App: React.FC = () => {
  const [imageState, setImageState] = useState<ImageState>({
    file: null,
    beforeUrl: null,
    afterUrl: null,
    finalUrl: null,
    mimeType: null,
  });
  
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('upload');
  
  // Dodge & Burn state
  const [dodge, setDodge] = useState(50);
  const [burn, setBurn] = useState(50);
  const [lightingStyle, setLightingStyle] = useState('Standard');
  const [creativePrompt, setCreativePrompt] = useState('');

  // Color Harmonization state
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const [selectedColors, setSelectedColors] = useState<ExtractedColor[]>([]);
  
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    // Only revoke blob URLs created with createObjectURL
    if (imageState.beforeUrl) URL.revokeObjectURL(imageState.beforeUrl);
    // afterUrl and finalUrl are data URLs from the API, no need to revoke
    
    setImageState({ file: null, beforeUrl: null, afterUrl: null, finalUrl: null, mimeType: null });
    setProcessingStep('upload');
    setError(null);
    setLoadingAction(null);
    setDodge(50);
    setBurn(50);
    setLightingStyle('Standard');
    setCreativePrompt('');
    setReferenceFile(null);
    setColorPalette(null);
    setSelectedColors([]);
  };

  const handleImageSelect = useCallback((file: File) => {
    resetState(); // Reset everything except the new file
    setImageState({
      file,
      beforeUrl: URL.createObjectURL(file),
      afterUrl: null,
      finalUrl: null,
      mimeType: file.type
    });
    setProcessingStep('dodge_burn');
  }, []);
  
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const base64data = (reader.result as string)?.split(',')[1];
            if (!base64data) {
                reject(new Error("Impossibile leggere i dati dell'immagine."));
            }
            resolve(base64data);
        }
        reader.onerror = () => {
          reject(new Error("Impossibile leggere il file."));
        }
    });
  };

  const handleProcessDodgeBurn = useCallback(async () => {
    if (!imageState.file || !imageState.mimeType) {
      setError("Nessun file immagine selezionato.");
      return;
    }

    setLoadingAction('dodge_burn');
    setError(null);
    setImageState(s => ({ ...s, afterUrl: null, finalUrl: null }));

    try {
      const base64data = await fileToBase64(imageState.file);
      const enhancedImageUrl = await generateEnhancedImage(
          base64data, 
          imageState.mimeType!, 
          dodge, 
          burn,
          lightingStyle,
          creativePrompt
        );
      setImageState(s => ({...s, afterUrl: enhancedImageUrl}));
      setProcessingStep('harmonization');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Si è verificato un errore sconosciuto.";
      setError(errorMessage);
    } finally {
      setLoadingAction(null);
    }
  }, [imageState.file, imageState.mimeType, dodge, burn, lightingStyle, creativePrompt]);

  const handleExtractColors = useCallback(async (file: File, count: number) => {
    setLoadingAction('extract');
    setError(null);
    setColorPalette(null);
    setSelectedColors([]);
    setReferenceFile(file);

    try {
      const base64data = await fileToBase64(file);
      const palette = await extractColorsFromImage(base64data, file.type, count);
      setColorPalette(palette);
    } catch(e) {
      const errorMessage = e instanceof Error ? e.message : "Si è verificato un errore sconosciuto.";
      setError(errorMessage);
    } finally {
      setLoadingAction(null);
    }
  }, []);

  const handleApplyColorTransfer = useCallback(async () => {
    if (!imageState.afterUrl || selectedColors.length === 0) {
      setError("Nessuna immagine elaborata o colori selezionati per il trasferimento.");
      return;
    }
    setLoadingAction('apply');
    setError(null);

    try {
      // Efficiently extract base64 data and mimeType from data URL
      const afterUrlParts = imageState.afterUrl.split(',');
      const mimeTypePart = afterUrlParts[0].split(':')[1];
      const mimeType = mimeTypePart.split(';')[0];
      const base64data = afterUrlParts[1];

      if (!base64data || !mimeType) {
        throw new Error("Impossibile analizzare l'immagine elaborata.");
      }

      const finalUrl = await applyColorTransfer(base64data, mimeType, selectedColors);
      setImageState(s => ({...s, finalUrl: finalUrl}));
      setProcessingStep('done');

    } catch(e) {
      const errorMessage = e instanceof Error ? e.message : "Si è verificato un errore sconosciuto.";
      setError(errorMessage);
    } finally {
      setLoadingAction(null);
    }
  }, [imageState.afterUrl, selectedColors]);

  const handleSuggestDodgeBurn = useCallback(async () => {
    if (!imageState.file || !imageState.mimeType) {
      setError("Nessun file immagine selezionato.");
      return;
    }

    setLoadingAction('suggest');
    setError(null);

    try {
      const base64data = await fileToBase64(imageState.file);
      const suggestion = await suggestDodgeAndBurn(
          base64data,
          imageState.mimeType!,
          creativePrompt
      );
      setDodge(suggestion.dodge);
      setBurn(suggestion.burn);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Si è verificato un errore sconosciuto.";
      setError(errorMessage);
    } finally {
      setLoadingAction(null);
    }
  }, [imageState.file, imageState.mimeType, creativePrompt]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-800 text-gray-100 font-sans">
      <header className="flex items-center p-4 border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-20">
        <CameraIcon className="w-8 h-8 mr-3 text-cyan-400" />
        <h1 className="text-2xl font-bold tracking-tight">Fujifilm AI Dodge & Burn Studio</h1>
      </header>
      
      {error && (
        <div className="bg-red-500/80 text-white p-3 text-center font-semibold z-10 relative" role="alert" onClick={() => setError(null)}>
          <p>{error}</p>
        </div>
      )}

      <main className="flex-grow flex flex-col md:flex-row">
        <aside className="w-full md:w-96 bg-gray-900/60 border-r border-gray-700 p-6 flex flex-col">
            <Stepper currentStep={processingStep} />
            <div className="mt-8 flex-grow flex flex-col">
                {processingStep === 'upload' && (
                    <div className="text-center text-gray-400 my-auto">
                        <h2 className="text-xl font-bold text-white mb-2">Benvenuto!</h2>
                        <p>Inizia caricando una foto per avviare il processo di miglioramento con l'AI.</p>
                        <p className="text-sm text-gray-500 mt-4">La tua immagine apparirà sulla destra.</p>
                    </div>
                )}
                {processingStep === 'dodge_burn' && (
                    <ControlPanel
                        dodge={dodge} setDodge={setDodge} burn={burn} setBurn={setBurn}
                        lightingStyle={lightingStyle} setLightingStyle={setLightingStyle}
                        creativePrompt={creativePrompt} setCreativePrompt={setCreativePrompt}
                        onProcess={handleProcessDodgeBurn}
                        onSuggest={handleSuggestDodgeBurn}
                        loadingAction={loadingAction}
                    />
                )}
                {(processingStep === 'harmonization' || processingStep === 'done') && (
                    <ColorHarmonizationPanel
                        onExtract={handleExtractColors}
                        onApplyTransfer={handleApplyColorTransfer}
                        palette={colorPalette}
                        selectedColors={selectedColors}
                        setSelectedColors={setSelectedColors}
                        loadingAction={loadingAction}
                        isDone={processingStep === 'done'}
                    />
                )}
            </div>
            {processingStep !== 'upload' && (
                <div className="mt-8 pt-6 border-t border-gray-700">
                    <button
                        onClick={resetState}
                        className="w-full px-4 py-2 bg-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500 transition-colors duration-200"
                    >
                        Inizia di Nuovo
                    </button>
                </div>
            )}
        </aside>

        <div className="flex-grow flex items-center justify-center p-4 bg-gray-800">
          {processingStep === 'upload' ? (
            <ImageUploader onImageSelect={handleImageSelect} setError={setError} />
          ) : (
            <ImageViewer
              beforeUrl={imageState.beforeUrl}
              afterUrl={imageState.afterUrl}
              finalUrl={imageState.finalUrl}
              loadingAction={loadingAction}
              step={processingStep}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;