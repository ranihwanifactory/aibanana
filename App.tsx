import React, { useState, useRef } from 'react';
import { generateOrEditImage } from './services/geminiService';
import { AppMode, ToastMessage } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ImageUploader } from './components/ImageUploader';
import { Toast } from './components/Toast';

const SAMPLE_PROMPTS = {
  generate: [
    "해질녘의 투명한 수정으로 만들어진 미래 도시",
    "화성에서 식물에 물을 주는 귀여운 로봇, 디지털 아트",
    "눈 덮인 산속의 아늑한 오두막 유화"
  ],
  edit: [
    "선글라스를 추가해줘",
    "배경을 사이버펑크 도시로 바꿔줘",
    "빈티지 연필 스케치 느낌으로 바꿔줘"
  ]
};

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('generate');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  // Edit mode state
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceMimeType, setSourceMimeType] = useState<string | null>(null);
  
  // UI state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  const addToast = (type: ToastMessage['type'], message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      addToast('error', '프롬프트 내용을 입력해주세요.');
      return;
    }

    if (mode === 'edit' && !sourceImage) {
      addToast('error', '편집할 이미지를 업로드해주세요.');
      return;
    }

    setIsLoading(true);
    setResultImage(null);

    try {
      const result = await generateOrEditImage(prompt, sourceImage || undefined, sourceMimeType || undefined);
      setResultImage(result);
      addToast('success', mode === 'generate' ? '이미지가 성공적으로 생성되었습니다!' : '이미지가 성공적으로 편집되었습니다!');
      
      // Scroll to result on mobile
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (error: any) {
      console.error(error);
      let msg = "오류가 발생했습니다. 다시 시도해주세요.";
      
      // Ensure we catch the error message even if it is a stringified JSON object
      const errorMessage = error.message || JSON.stringify(error);
      
      if (errorMessage.includes("429") || errorMessage.includes("Quota") || errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        msg = "현재 이용량이 많아 제한되었습니다. 약 1분 후 다시 시도해주세요.";
      } else if (errorMessage.includes("400")) {
        msg = "요청이 거부되었습니다. 지원하지 않는 콘텐츠 유형일 수 있습니다.";
      } else if (errorMessage.includes("503")) {
        msg = "서비스가 일시적으로 불안정합니다. 잠시 후 다시 시도해주세요.";
      }
      
      addToast('error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = `banana-vision-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-indigo-200 selection:text-indigo-900 pb-20">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end pointer-events-none">
        <div className="pointer-events-auto">
          {toasts.map(toast => (
            <Toast key={toast.id} toast={toast} onClose={removeToast} />
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
              B
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              BananaVision
            </h1>
          </div>
          <div className="text-xs font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">
            gemini-2.5-flash-image
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Mode Switcher */}
        <div className="flex justify-center mb-10">
          <div className="bg-white p-1.5 rounded-xl inline-flex shadow-sm border border-slate-200">
            <button
              onClick={() => setMode('generate')}
              className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === 'generate' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              생성하기
            </button>
            <button
              onClick={() => setMode('edit')}
              className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === 'edit' 
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-200' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              편집하기
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          {/* Input Section */}
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-slate-200/50">
              <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center">
                <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm mr-3 border border-indigo-100 font-bold">1</span>
                {mode === 'generate' ? '상상하는 이미지를 설명해주세요' : '이미지 업로드 & 편집 요청'}
              </h2>

              {/* Edit Mode: Image Uploader */}
              {mode === 'edit' && (
                <div className="mb-6">
                  <ImageUploader 
                    currentImage={sourceImage}
                    onImageSelected={(base64, mime) => {
                      setSourceImage(base64);
                      setSourceMimeType(mime);
                    }}
                    onClear={() => {
                      setSourceImage(null);
                      setSourceMimeType(null);
                    }}
                  />
                </div>
              )}

              {/* Prompt Input */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700 ml-1">
                  {mode === 'generate' ? '프롬프트' : '편집 지시사항'}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={mode === 'generate' 
                    ? "예: 신스웨이브 스타일의 산 로고..." 
                    : "예: 사람에게 빨간 모자를 씌워줘..."
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none h-32 transition-all placeholder:text-slate-400 text-base"
                />
                
                {/* Suggestions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {SAMPLE_PROMPTS[mode].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPrompt(p)}
                      className="text-xs bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-100 hover:border-indigo-200 px-3 py-1.5 rounded-full transition-all shadow-sm truncate max-w-full font-medium"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className={`w-full mt-6 py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  mode === 'generate'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-200 text-white'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-200 text-white'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    처리 중...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
                    </svg>
                    {mode === 'generate' ? '이미지 생성하기' : '이미지 변환하기'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result Section */}
          <div ref={resultRef} className="space-y-6 min-h-[400px]">
             <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-slate-200/50 h-full flex flex-col">
                <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center">
                  <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm mr-3 border border-indigo-100 font-bold">2</span>
                  결과
                </h2>
                
                <div className="flex-1 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden min-h-[350px]">
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : resultImage ? (
                    <div className="relative group w-full h-full flex items-center justify-center p-2">
                       <img 
                        src={resultImage} 
                        alt="Generated Result" 
                        className="max-w-full max-h-full rounded-lg shadow-lg object-contain animate-fade-in bg-white" 
                      />
                      <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                         <button 
                           onClick={handleDownload}
                           className="bg-white text-slate-900 hover:bg-slate-50 px-6 py-2.5 rounded-full font-bold shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 border border-slate-200"
                         >
                           다운로드
                         </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                       <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 shadow-sm">
                         <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                         </svg>
                       </div>
                       <p className="text-slate-500 font-medium">결과 이미지가 여기에 표시됩니다</p>
                       <p className="text-slate-400 text-sm mt-2">아이디어를 현실로 만들어보세요</p>
                    </div>
                  )}
                </div>
                
                {resultImage && !isLoading && (
                  <div className="mt-4 flex justify-end">
                    <button onClick={handleDownload} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center transition-colors">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                      </svg>
                      이미지 저장
                    </button>
                  </div>
                )}
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;