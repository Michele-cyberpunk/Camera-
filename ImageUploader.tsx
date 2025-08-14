import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  setError: (error: string | null) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, setError }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileValidation = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 20 * 1024 * 1024; // 20 MB

    if (!validTypes.includes(file.type)) {
      setError('Tipo di file non valido. Carica un\'immagine JPEG, PNG o WEBP. Nota: i file .RAF non sono supportati in questa demo.');
      return false;
    }
    if (file.size > maxSize) {
      setError('File troppo grande. Carica un\'immagine più piccola di 20MB.');
      return false;
    }
    return true;
  };

  const handleFileSelect = useCallback((file: File | undefined) => {
    setError(null);
    if (file && handleFileValidation(file)) {
      onImageSelect(file);
    }
  }, [onImageSelect, setError]);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0]);
  };

  return (
    <div
      className={`w-full h-full flex items-center justify-center p-8 transition-colors duration-300 ${isDragging ? 'bg-gray-700/50' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <label htmlFor="file-upload" className="relative cursor-pointer w-full max-w-lg h-80 flex flex-col items-center justify-center border-2 border-dashed border-gray-500 rounded-2xl hover:border-gray-400 hover:bg-gray-800/50 transition-all duration-300 text-center">
        <UploadIcon className="w-16 h-16 text-gray-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-300">Trascina la tua foto qui</h3>
        <p className="text-gray-500 mt-1">o fai clic per selezionarla</p>
        <p className="text-xs text-gray-600 mt-4">Formati supportati: JPEG, PNG, WEBP (Max 20MB)</p>
        <p className="text-xs text-gray-600 mt-1">Nota: il supporto completo per .RAF è una funzionalità futura</p>
        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={onFileChange} accept="image/jpeg,image/png,image/webp" />
      </label>
    </div>
  );
};

export default ImageUploader;