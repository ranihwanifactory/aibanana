import React, { useCallback } from 'react';

interface ImageUploaderProps {
  currentImage: string | null;
  onImageSelected: (base64: string, mimeType: string) => void;
  onClear: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ currentImage, onImageSelected, onClear }) => {
  
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        onImageSelected(result, file.type);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageSelected]);

  if (currentImage) {
    return (
      <div className="relative group w-full h-64 bg-slate-100 rounded-xl overflow-hidden border-2 border-slate-200 shadow-inner">
        <img 
          src={currentImage} 
          alt="Source to edit" 
          className="w-full h-full object-contain"
        />
        <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
          <button 
            onClick={onClear}
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-md"
          >
            이미지 제거
          </button>
        </div>
      </div>
    );
  }

  return (
    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all group bg-white">
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <svg className="w-10 h-10 mb-3 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <p className="mb-2 text-sm text-slate-500"><span className="font-semibold text-slate-700">클릭하여 이미지 업로드</span></p>
        <p className="text-xs text-slate-400">PNG, JPG 최대 10MB</p>
      </div>
      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
    </label>
  );
};