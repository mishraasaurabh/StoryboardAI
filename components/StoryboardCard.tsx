
import React from 'react';
import { StoryboardItem } from '../types';

interface StoryboardCardProps {
  item: StoryboardItem;
}

const StoryboardCard: React.FC<StoryboardCardProps> = ({ item }) => {
  return (
    <div className={`bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border transition-all duration-500 ${item.error ? 'border-red-500/50' : 'border-slate-800 hover:border-orange-500/30'}`}>
      
      <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Scene {item.scene_id} • Beat {item.sceneNumber}</span>
        <span className="text-[9px] font-bold text-orange-500 bg-orange-500/10 px-3 py-0.5 rounded-full uppercase">{item.mood}</span>
      </div>

      <div className="relative aspect-video bg-slate-900 flex items-center justify-center">
        {item.isGenerating ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="text-[10px] text-slate-600 font-bold uppercase animate-pulse">Painting Frame...</p>
          </div>
        ) : item.error ? (
          <div className="p-6 text-center">
            <p className="text-xs font-bold text-red-500 uppercase mb-1">Visual Blocked</p>
            <p className="text-[10px] text-slate-500 leading-tight">{item.error}</p>
          </div>
        ) : (
          <img src={item.imageUrl} alt={`Scene ${item.scene_id}`} className="w-full h-full object-cover" />
        )}
      </div>

      <div className="p-6">
        <div className="mb-4 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
           <div className="flex items-center gap-2 mb-2 text-[9px] font-black text-slate-500 uppercase">
             <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
             Script & Audio
           </div>
           
           <div className="space-y-2 mb-3">
              {item.dialogue ? item.dialogue.map((d, i) => (
                <div key={i} className="text-[10px] leading-snug">
                  <span className="font-black text-orange-500 uppercase mr-1">{d.speaker}:</span>
                  <span className="text-slate-300">{d.text}</span>
                </div>
              )) : (
                <p className="text-[11px] text-white/90 leading-snug italic">"{item.audioScript}"</p>
              )}
           </div>

           {item.audioUrl && (
             <audio controls className="w-full h-7 brightness-75 contrast-125 rounded-lg overflow-hidden">
               <source src={item.audioUrl} type="audio/wav" />
             </audio>
           )}
        </div>

        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">
           <span>{item.location}</span>
           <span>{item.timeOfDay}</span>
        </div>
        
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {item.description}
        </p>
      </div>
    </div>
  );
};

export default StoryboardCard;
