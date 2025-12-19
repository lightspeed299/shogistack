import React from 'react';
import { BoardState, Coordinates, PieceType, Player } from '../types';
import { PIECE_KANJI } from '../constants';

interface ShogiBoardProps {
  board: BoardState;
  onSquareClick: (coords: Coordinates) => void;
  selectedSquare: Coordinates | null;
  validMoves: Coordinates[];
  lastMove: { from: Coordinates | 'hand'; to: Coordinates } | null;
  turn: Player;
}

const ShogiBoard: React.FC<ShogiBoardProps> = ({ 
  board, 
  onSquareClick, 
  selectedSquare, 
  lastMove,
  turn
}) => {
  // Hoshi (Star points) coordinates
  const isHoshi = (x: number, y: number) => {
    return (x === 2 || x === 5) && (y === 2 || y === 5);
  };

  return (
    <div className="relative select-none touch-manipulation shadow-2xl rounded-sm overflow-hidden ring-1 ring-[#5c3a1e]">
      
      {/* Board Bezel/Frame */}
      <div className="bg-[#b48a5f] p-1 pb-2 pr-2">
        
        {/* Main Board Area */}
        <div 
            className="grid grid-cols-9 gap-[1px] bg-stone-800 border-2 border-stone-800"
            style={{ width: '100%', aspectRatio: '9/10' ,gridTemplateRows: 'repeat(9, 1fr)'}}
        >
          {board.map((row, y) => (
            row.map((piece, x) => {
              const isSelected = selectedSquare?.x === x && selectedSquare?.y === y;
              const isLastMoveSrc = lastMove?.from !== 'hand' && lastMove?.from.x === x && lastMove?.from.y === y;
              const isLastMoveDst = lastMove?.to.x === x && lastMove?.to.y === y;
              
              return (
                <div
                  key={`${x}-${y}`}
                  onClick={() => onSquareClick({ x, y })}
                  className={`
                    relative flex items-center justify-center
                    cursor-pointer
                    ${isSelected ? 'bg-[#f5e6cd]' : isLastMoveDst ? 'bg-[#d8b068]' : isLastMoveSrc ? 'bg-[#dcc08e]' : 'bg-[#e0c38c]'}
                  `}
                >
                  {/* Hoshi (Star Points) */}
                  {isHoshi(x, y) && !piece && (
                    <div className="absolute w-1.5 h-1.5 bg-stone-800/80 rounded-full pointer-events-none" />
                  )}

                  {/* Piece Rendering */}
                  {piece && (
                    <div 
                      className={`
                        w-full h-full flex items-center justify-center
                        font-shogi font-bold text-2xl sm:text-3xl lg:text-4xl leading-none
                        ${piece.owner === 'gote' ? 'rotate-180 mb-1' : 'mt-1'}
                        ${piece.isPromoted ? 'text-[#c62828]' : 'text-stone-900'}
                        drop-shadow-[0_1px_0_rgba(255,255,255,0.3)]
                        transition-transform duration-150
                      `}
                      style={{
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                    >
                      {PIECE_KANJI[piece.type]}
                    </div>
                  )}
                  
                  {/* Selection Indicator Overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 ring-inset ring-2 ring-amber-500 pointer-events-none" />
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>
      
      {/* Coordinate Labels - Right Side (Japanese style often puts numbers on top/right) */}
      <div className="absolute -top-4 left-0 w-full flex justify-between px-[2%] text-[9px] text-stone-500 font-mono tracking-widest">
        <span>9</span><span>8</span><span>7</span><span>6</span><span>5</span><span>4</span><span>3</span><span>2</span><span>1</span>
      </div>
      <div className="absolute top-0 -right-3 h-full flex flex-col justify-between py-[2%] text-[9px] text-stone-500 font-mono">
        <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>七</span><span>八</span><span>九</span>
      </div>
    </div>
  );
};

export default ShogiBoard;