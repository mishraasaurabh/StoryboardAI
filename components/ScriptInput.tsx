
import React, { useState } from 'react';

interface ScriptInputProps {
  onProcess: (text: string) => void;
  isLoading: boolean;
}

const ScriptInput: React.FC<ScriptInputProps> = ({ onProcess, isLoading }) => {
  const [text, setText] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') setText(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) onProcess(text);
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Project JSON Data</h3>
            <label className="text-[10px] font-bold text-orange-500 cursor-pointer hover:underline uppercase flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              Upload JSON
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
          
          <textarea
            className="w-full h-80 bg-slate-950 text-slate-200 border border-slate-800 rounded-xl p-6 focus:ring-2 focus:ring-orange-500/50 focus:border-transparent resize-none font-mono text-[11px] leading-relaxed"
            placeholder='{ "project_title": "...", "style": { ... }, "scenes": [ ... ] }'
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
          />
          
          <div className="mt-6">
            <button
              type="submit"
              disabled={!text.trim() || isLoading}
              className="w-full py-5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-black rounded-xl transition-all shadow-2xl flex items-center justify-center gap-3 group uppercase tracking-widest text-xs"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Rendering Storyboard Project...</span>
                </>
              ) : (
                <>
                  <span>Begin Production</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ScriptInput;
