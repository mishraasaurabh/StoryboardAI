
import React from 'react';
import { StoryboardItem } from '../types';

interface StoryboardCardProps {
  item: StoryboardItem;
  onRetry?: () => void;
}

const StoryboardCard: React.FC<StoryboardCardProps> = ({ item, onRetry }) => {
  const handleDownloadImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.imageUrl) return;
    const link = document.createElement('a');
    link.href = item.imageUrl;
    link.download = `frame-${item.sceneNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border transition-all duration-500 ${item.error ? 'border-red-500/50' : 'border-slate-800 hover:border-orange-500/30'}`}>
      
      {/* Top Banner */}
      <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Shot Sequence {Math.ceil(item.sceneNumber / 8)}</span>
        <span className="text-[10px] font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full uppercase">Frame {item.sceneNumber}</span>
      </div>

      <div className="grid grid-cols-1 bg-slate-950">
        <div className="relative aspect-video bg-slate-900 flex items-center justify-center group">
          {item.isGenerating ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-[10px] text-slate-600 font-bold uppercase animate-pulse">Rendering Beat...</p>
            </div>
          ) : item.error ? (
            <div className="p-6 text-center">
              <p className="text-xs font-bold text-red-500 uppercase mb-1">Rendering Error</p>
              <p className="text-[10px] text-slate-500 leading-tight">{item.error}</p>
            </div>
          ) : item.imageUrl ? (
            <>
              <img src={item.imageUrl} alt={`Frame ${item.sceneNumber}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <button onClick={handleDownloadImage} className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-[10px] font-bold py-1.5 px-3 rounded-lg border border-white/10 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  Save Frame
                </button>
              </div>
            </>
          ) : (
            <div className="text-slate-800 text-[10px] font-bold uppercase tracking-widest">Waiting for Director</div>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Audio Player Section */}
        <div className="mb-6 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              AI Audio Script
            </span>
            {item.isAudioGenerating && (
              <span className="text-[8px] text-orange-500 font-bold uppercase animate-pulse">Synthesizing...</span>
            )}
          </div>
          
          <p className="text-[11px] text-white/90 font-medium mb-3 leading-tight border-l-2 border-orange-500/50 pl-3 py-1 bg-white/5 rounded-r">
            {item.audioScript || '...'}
          </p>

          {item.audioUrl && !item.isAudioGenerating && (
            <audio controls className="w-full h-8 brightness-90 contrast-125">
              <source src={item.audioUrl} type="audio/wav" />
            </audio>
          )}
        </div>

        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xs font-black text-slate-100 uppercase tracking-tight">{item.location}</h3>
          <span className="text-[9px] font-bold text-slate-400 uppercase">{item.timeOfDay}</span>
        </div>

        <p className="text-slate-400 text-xs leading-relaxed mb-6 italic">
          &ldquo;{item.description}&rdquo;
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black text-slate-600 uppercase">Mood</span>
            <span className="text-[9px] font-bold text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full uppercase tracking-tighter">{item.mood}</span>
          </div>
          <div className="flex gap-1">
             <div className="w-1 h-1 rounded-full bg-slate-700"></div>
             <div className="w-1 h-1 rounded-full bg-slate-700"></div>
             <div className="w-1 h-1 rounded-full bg-slate-700"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryboardCard;
