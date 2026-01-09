
import React, { useState, useEffect } from 'react';

interface ScriptInputProps {
  onProcess: (text: string, isMultimodal: boolean) => void;
  isLoading: boolean;
}

const ScriptInput: React.FC<ScriptInputProps> = ({ onProcess, isLoading }) => {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'text' | 'multimodal'>('text');

  // Auto-detect mode based on manual text input
  useEffect(() => {
    const trimmed = text.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      setMode('multimodal');
    } else if (trimmed.length > 0) {
      setMode('text');
    }
  }, [text]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onProcess(text, mode === 'multimodal');
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex justify-center mb-8">
        <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex gap-1 relative">
          <button 
            type="button"
            onClick={() => setMode('text')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'text' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-200'}`}
          >
            Script Text
          </button>
          <button 
            type="button"
            onClick={() => setMode('multimodal')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'multimodal' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-200'}`}
          >
            Multimodal JSON
          </button>
          
          {mode === 'multimodal' && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest animate-pulse">JSON Detected: 8-Frame Mode Active</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative group">
          <div className={`absolute -inset-1 bg-gradient-to-r ${mode === 'text' ? 'from-blue-600 to-indigo-600' : 'from-orange-600 to-red-600'} rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000`}></div>
          <div className="relative bg-slate-900 rounded-2xl p-6 border border-slate-700">
            <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-widest flex justify-between">
              <span>{mode === 'text' ? 'Standard Script' : 'Multimodal Prompt (JSON Array)'}</span>
              {mode === 'multimodal' && <span className="text-orange-500 text-[10px]">Ready for expansion</span>}
            </label>
            <textarea
              className="w-full h-64 bg-slate-950 text-slate-200 border border-slate-800 rounded-xl p-4 focus:ring-2 focus:ring-orange-500/50 focus:border-transparent resize-none font-mono text-sm leading-relaxed"
              placeholder={mode === 'text' 
                ? "INT. KITCHEN - DAY. MOTHER wipes tears as she cooks..." 
                : '[{ "audio": "Dialogue text...", "image": "Shot description..." }]'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isLoading}
            />
            
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white transition-colors bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 w-full sm:w-auto justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                  <span className="text-sm font-medium">Load Script</span>
                  <input type="file" accept=".txt,.json" onChange={handleFileUpload} className="hidden" disabled={isLoading} />
                </label>
              </div>
              
              <button
                type="submit"
                disabled={!text.trim() || isLoading}
                className={`w-full sm:w-auto px-10 py-4 ${mode === 'text' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-orange-600 hover:bg-orange-500'} disabled:bg-slate-700 text-white font-black rounded-xl transition-all shadow-xl flex items-center justify-center gap-3 group uppercase tracking-widest text-xs`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Directing Sequence...</span>
                  </>
                ) : (
                  <>
                    <span>Action: Generate 8 Frames</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ScriptInput;
