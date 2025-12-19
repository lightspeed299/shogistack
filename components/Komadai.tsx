import React from 'react';
import { Hand, PieceType, Player } from '../types';
import { PIECE_KANJI } from '../constants';

interface KomadaiProps {
  hand: Hand;
  owner: Player;
  isCurrentTurn: boolean;
  onSelectPiece: (piece: PieceType) => void;
  selectedPiece: PieceType | null;
}

const Komadai: React.FC<KomadaiProps> = ({ hand, owner, isCurrentTurn, onSelectPiece, selectedPiece }) => {
  // Order pieces by value
  const order = [
    PieceType.Rook,
    PieceType.Bishop,
    PieceType.Gold,
    PieceType.Silver,
    PieceType.Knight,
    PieceType.Lance,
    PieceType.Pawn,
  ];

  const hasPieces = Object.values(hand).some(c => c > 0);

  return (
    <div className={`
      relative w-full px-2 py-3 rounded-md transition-all duration-200
      bg-[#b48a5f] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border border-[#8B5A2B]
      flex flex-wrap gap-2 min-h-[56px] items-center
      ${isCurrentTurn ? 'ring-2 ring-amber-400/50' : 'opacity-90 grayscale-[30%]'}
    `}>
      {/* Wood Texture Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px'}}></div>

      {/* Label */}
      <div className="absolute -top-2 left-2 px-1 bg-[#8B5A2B] text-[9px] text-amber-100 rounded uppercase tracking-widest shadow-sm z-10">
        {owner === 'sente' ? 'Komadai (You)' : 'Komadai (Opponent)'}
      </div>

      {!hasPieces && (
        <div className="w-full text-center text-[#5c3a1e] text-xs font-serif italic opacity-50">
          Empty
        </div>
      )}

      {order.map((type) => {
        const count = hand[type];
        if (count === 0) return null;

        return (
          <button
            key={type}
            disabled={!isCurrentTurn}
            onClick={() => onSelectPiece(type)}
            className={`
              relative group
              w-9 h-10 flex items-center justify-center 
              font-shogi font-bold rounded-sm shadow-sm
              transition-transform duration-100
              ${selectedPiece === type 
                ? 'bg-[#f3dbb3] text-stone-900 -translate-y-1 shadow-lg ring-1 ring-amber-500' 
                : 'bg-[#e0c38c] text-stone-800 hover:bg-[#ebd5a8]'}
              ${!isCurrentTurn ? 'cursor-default' : 'cursor-pointer active:scale-95'}
              piece-shape
            `}
            style={{
               clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0% 100%)' // Subtle shogi piece shape
            }}
          >
            <span className="text-lg leading-none mt-1">{PIECE_KANJI[type]}</span>
            {count > 1 && (
              <span className="absolute -top-1 -right-1 bg-stone-800 text-amber-100 text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-sans border border-amber-500/50 shadow-sm z-20">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Komadai;