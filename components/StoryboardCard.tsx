
import React from 'react';
import { StoryboardItem, DialogueEntry } from '../types';

interface StoryboardCardProps {
  item: StoryboardItem;
}

const StoryboardCard: React.FC<StoryboardCardProps> = ({ item }) => {
  const handleDownloadImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.imageUrl) return;
    const link = document.createElement('a');
    link.href = item.imageUrl;
    link.download = `scene-${item.scene_id}-beat-${item.sceneNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const dialogues: DialogueEntry[] = item.audioConfig?.dialogues || 
                                    (item.audioConfig?.dialogue ? [item.audioConfig.dialogue] : []);

  return (
    <div className={`bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border transition-all duration-500 ${item.error ? 'border-red-500/50' : 'border-slate-800 hover:border-orange-500/30'}`}>
      
      <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Scene {item.scene_id}</span>
          <span className="text-[10px] font-black text-slate-700">/</span>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Beat {item.sceneNumber}</span>
        </div>
        <span className="text-[9px] font-bold text-orange-500 bg-orange-500/10 px-3 py-0.5 rounded-full uppercase border border-orange-500/20">{item.mood}</span>
      </div>

      <div className="relative aspect-video bg-slate-950 flex items-center justify-center group overflow-hidden">
        {item.isGenerating ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="text-[10px] text-slate-600 font-bold uppercase animate-pulse">Painting Vision...</p>
          </div>
        ) : item.error ? (
          <div className="p-6 text-center max-w-xs">
            <p className="text-xs font-bold text-red-500 uppercase mb-1">Visual Blocked</p>
            <p className="text-[10px] text-slate-500 leading-tight">{item.error}</p>
          </div>
        ) : (
          <>
            <img 
              src={item.imageUrl} 
              alt={`Scene ${item.scene_id}`} 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
              <button 
                onClick={handleDownloadImage}
                className="bg-orange-600 hover:bg-orange-500 text-white p-3 rounded-full shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
                </svg>
                <span className="text-[10px] font-black uppercase tracking-widest pr-1">Save Keyframe</span>
              </button>
            </div>
          </>
        )}
      </div>

      <div className="p-6 space-y-5">
        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 shadow-inner">
           <div className="flex items-center gap-2 mb-3 text-[9px] font-black text-slate-500 uppercase">
             <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
             Soundtrack & Dialogue
           </div>
           
           <div className="space-y-3 mb-4">
              {dialogues.length > 0 ? dialogues.map((d, i) => (
                <div key={i} className="text-[11px] leading-relaxed group/line">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-black text-orange-500 uppercase text-[9px]">{d.speaker}</span>
                    <span className="h-px bg-slate-800 flex-grow"></span>
                  </div>
                  <span className="text-slate-300 italic group-hover/line:text-white transition-colors">"{d.text}"</span>
                </div>
              )) : (
                <p className="text-[11px] text-white/90 leading-relaxed italic border-l-2 border-slate-800 pl-3">
                  "{item.audioScript}"
                </p>
              )}
           </div>

           {item.isAudioGenerating ? (
             <div className="h-8 flex items-center justify-center bg-slate-900/50 rounded-lg animate-pulse border border-slate-800/50">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Synthesizing...</span>
             </div>
           ) : item.audioUrl ? (
             <audio controls className="w-full h-8 brightness-90 contrast-125 rounded-lg overflow-hidden">
               <source src={item.audioUrl} type="audio/wav" />
             </audio>
           ) : (
             <div className="h-8 flex items-center justify-center bg-slate-900/30 rounded-lg border border-slate-800/30">
                <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest italic">Silent Frame</span>
             </div>
           )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.location}</span>
             <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{item.timeOfDay}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
            {item.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StoryboardCard;
