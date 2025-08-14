import React from 'react';

interface ImageViewerProps {
  beforeUrl: string | null;
  afterUrl: string | null;
  finalUrl: string | null;
  loadingAction: string | null;
  step: 'dodge_burn' | 'harmonization' | 'done';
}

const ImagePanel = ({ title, imageUrl, isLoading, placeholder }: { title: string, imageUrl: string | null, isLoading?: boolean, placeholder: string }) => {
  return (
    <div className="w-1/2 flex flex-col p-4">
      <h3 className="text-lg font-semibold text-center text-gray-400 mb-4">{title}</h3>
      <div className="aspect-square w-full bg-black rounded-lg flex items-center justify-center overflow-hidden border border-gray-700 shadow-lg">
        {isLoading ? (
          <div className="w-full h-full bg-gray-800 animate-pulse"></div>
        ) : imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-contain" />
        ) : (
          <div className="text-gray-600 p-4 text-center">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
};

const ImageViewer: React.FC<ImageViewerProps> = ({ beforeUrl, afterUrl, finalUrl, loadingAction, step }) => {
  const rightImageUrl = finalUrl || afterUrl;
  const rightTitle = step === 'dodge_burn' ? 'Migliorata (Luce)' : 'Risultato Finale';
  const rightPlaceholder = step === 'dodge_burn' 
    ? "L'immagine migliorata apparirà qui" 
    : "L'immagine finale armonizzata apparirà qui";

  const isRightImageLoading = loadingAction === 'dodge_burn' || loadingAction === 'apply';

  return (
    <div className="flex-grow flex p-4 space-x-4">
      <ImagePanel title="Originale" imageUrl={beforeUrl} placeholder='Immagine Originale' />
      <ImagePanel title={rightTitle} imageUrl={rightImageUrl} isLoading={isRightImageLoading} placeholder={rightPlaceholder} />
    </div>
  );
};

export default ImageViewer;