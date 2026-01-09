
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
      onProcess(text);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-slate-900 rounded-2xl p-6 border border-slate-700">
            <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-widest">
              Input Script
            </label>
            <textarea
              className="w-full h-64 bg-slate-950 text-slate-200 border border-slate-800 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed"
              placeholder="Paste your script here or upload a file below... (e.g. INT. COFFEE SHOP - DAY. SARAH enters, looking frantic...)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isLoading}
            />
            
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white transition-colors bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 w-full sm:w-auto justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                  <span className="text-sm font-medium">Upload .txt</span>
                  <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" disabled={isLoading} />
                </label>
              </div>
              
              <button
                type="submit"
                disabled={!text.trim() || isLoading}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Analyzing Script...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Storyboard</span>
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
