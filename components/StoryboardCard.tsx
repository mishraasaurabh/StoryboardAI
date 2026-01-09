
import React from 'react';
import { StoryboardItem } from '../types';

interface StoryboardCardProps {
  item: StoryboardItem;
  onRetry?: () => void;
}

const StoryboardCard: React.FC<StoryboardCardProps> = ({ item, onRetry }) => {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.imageUrl) return;
    
    const link = document.createElement('a');
    link.href = item.imageUrl;
    const safeLocation = item.location.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `scene-${item.sceneNumber}-${safeLocation}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`bg-slate-800 rounded-xl overflow-hidden shadow-2xl border flex flex-col h-full transition-all duration-300 ${item.error ? 'border-red-500/50' : 'border-slate-700 hover:scale-[1.02] hover:border-blue-500/50'}`}>
      <div className="relative aspect-video bg-slate-900 overflow-hidden flex items-center justify-center">
        {item.isGenerating ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400 font-medium">Sketching scene {item.sceneNumber}...</p>
          </div>
        ) : item.error ? (
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <p className="text-sm font-bold text-red-400">Generation Failed</p>
              <p className="text-xs text-slate-500 mt-1">Tap retry to attempt again</p>
            </div>
            {onRetry && (
              <button 
                onClick={onRetry}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                Retry Frame
              </button>
            )}
          </div>
        ) : item.imageUrl ? (
          <img 
            src={item.imageUrl} 
            alt={`Scene ${item.sceneNumber}`} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-slate-500 text-center px-4">
            <p className="text-sm font-medium">Waiting for generation...</p>
          </div>
        )}
        
        {/* Frame Number Badge */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 pointer-events-none">
          <span className="text-xs font-bold text-white uppercase tracking-wider">Frame {item.sceneNumber}</span>
        </div>

        {/* Download Button */}
        {item.imageUrl && !item.isGenerating && !item.error && (
          <button 
            onClick={handleDownload}
            className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-blue-600 hover:border-blue-400 transition-all group"
            title="Download Frame"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-y-0.5 transition-transform"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          </button>
        )}
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-slate-100 uppercase tracking-tight">{item.location}</h3>
          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold uppercase">{item.timeOfDay}</span>
        </div>
        
        <p className="text-slate-400 text-sm italic mb-4 leading-relaxed">
          &ldquo;{item.description}&rdquo;
        </p>
        
        <div className="mt-auto pt-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Mood</span>
            <span className="text-[10px] font-medium text-slate-300 bg-slate-700 px-2 py-0.5 rounded-full">{item.mood}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryboardCard;
