import React from 'react';
import { Player } from '../types';

interface PlayerInfoProps {
  player: Player;
  isTurn: boolean;
  name: string;
  rank: string;
  time?: string; // Placeholder for future timer
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ player, isTurn, name, rank, time }) => {
  const isSente = player === 'sente';
  
  return (
    <div className={`
      flex items-center justify-between px-4 py-2 w-full
      ${isTurn ? 'bg-stone-800 border-l-4 border-amber-500' : 'bg-transparent border-l-4 border-transparent'}
      transition-all duration-300
    `}>
      <div className="flex items-center gap-3">
        {/* Avatar Placeholder */}
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center text-stone-900 font-bold shadow-md
          ${isSente ? 'bg-stone-300' : 'bg-stone-400'}
        `}>
          {isSente ? '☗' : '☖'}
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className={`font-bold text-sm ${isTurn ? 'text-amber-100' : 'text-stone-400'}`}>
              {name}
            </span>
            <span className="text-xs text-stone-500 font-mono">{rank}</span>
          </div>
          <div className="text-[10px] text-stone-500 uppercase tracking-wider">
            {isSente ? 'Sente (First)' : 'Gote (Second)'}
          </div>
        </div>
      </div>

      {isTurn && (
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
           <span className="text-xs text-amber-500 font-medium">Thinking</span>
        </div>
      )}
    </div>
  );
};

export default PlayerInfo;