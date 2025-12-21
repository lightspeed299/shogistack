import React from 'react';
import { Hand, PieceType, Player } from '../types';

// 漢数字マッピング
const PIECE_KANJI: Record<PieceType, string> = {
  [PieceType.Pawn]: '歩',
  [PieceType.Lance]: '香',
  [PieceType.Knight]: '桂',
  [PieceType.Silver]: '銀',
  [PieceType.Gold]: '金',
  [PieceType.Bishop]: '角',
  [PieceType.Rook]: '飛',
  [PieceType.King]: '王',
  [PieceType.PromotedPawn]: 'と',
  [PieceType.PromotedLance]: '成香',
  [PieceType.PromotedKnight]: '成桂',
  [PieceType.PromotedSilver]: '成銀',
  [PieceType.Horse]: '馬',
  [PieceType.Dragon]: '龍',
};

// 表示順序（飛車〜歩）
const ORDER = [
  PieceType.Rook,
  PieceType.Bishop,
  PieceType.Gold,
  PieceType.Silver,
  PieceType.Knight,
  PieceType.Lance,
  PieceType.Pawn,
];

interface KomadaiProps {
  hand: Hand;
  owner: Player;
  isCurrentTurn: boolean;
  onSelectPiece: (piece: PieceType) => void;
  selectedPiece: PieceType | null;
}

const Komadai: React.FC<KomadaiProps> = ({ hand, owner, isCurrentTurn, onSelectPiece, selectedPiece }) => {
  // 将棋の駒らしい末広がりの五角形
  const pieceShape = "polygon(50% 0%, 85% 25%, 95% 100%, 5% 100%, 15% 25%)";

  return (
    <div className={`
      w-full px-3 py-2 rounded-md shadow-inner min-h-[80px] flex items-center
      /* ★修正: 色を元の木目調に戻しました */
      bg-[#d4a373] border-t-2 border-b-4 border-x-2 border-[#a67c52]
      transition-all duration-300
      ${isCurrentTurn ? 'ring-2 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'opacity-90'}
    `}>
      <div className="flex flex-wrap gap-2 justify-center items-end w-full">
        {ORDER.map((type) => {
          const count = hand[type];
          if (count === 0) return null;

          const isSelected = selectedPiece === type;

          return (
            <div 
              key={type}
              onClick={() => isCurrentTurn && onSelectPiece(type)}
              className={`
                relative cursor-pointer select-none group
                flex items-center justify-center
                transition-all duration-200 ease-out
                ${isCurrentTurn ? 'hover:-translate-y-1' : 'cursor-default'}
                
                /* 選択時の浮遊アクション (これは維持) */
                ${isSelected ? '-translate-y-3 scale-110 z-10' : 'translate-y-0'}
              `}
              style={{ 
                width: '40px', 
                height: '46px',
                // 選択時に金色のオーラ（ドロップシャドウ）を放つ
                filter: isSelected 
                  ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.9)) drop-shadow(0 0 15px rgba(245, 158, 11, 0.5))' 
                  : 'drop-shadow(1px 2px 2px rgba(0,0,0,0.5))'
              }}
            >
              {/* 駒の本体 */}
              <div 
                className={`
                  absolute inset-0 flex items-end justify-center pb-1.5
                  font-serif font-bold text-xl leading-none
                  transition-colors duration-200
                  ${isSelected 
                    ? 'bg-gradient-to-br from-[#ffebc2] to-[#ffdca0] text-black' // 選択時は少し明るく
                    : 'bg-gradient-to-b from-[#f3d398] to-[#e0b87e] text-stone-900'} // 通常時は元の色味
                `}
                style={{
                  clipPath: pieceShape,
                }}
              >
                <span>{PIECE_KANJI[type]}</span>
              </div>

              {/* 枚数バッジ (右上に表示) */}
              {count > 1 && (
                <div className={`
                  absolute -top-1 -right-1 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-white shadow-md z-20
                  ${isSelected ? 'bg-red-600 text-white animate-bounce' : 'bg-red-700 text-white'}
                `}>
                  {count}
                </div>
              )}
            </div>
          );
        })}
        
        {/* 持ち駒がない場合 */}
        {Object.values(hand).every(c => c === 0) && (
          <div className="text-[#8c6b4a] text-xs font-bold opacity-60 w-full text-center tracking-widest">
            なし
          </div>
        )}
      </div>
    </div>
  );
};

export default Komadai;