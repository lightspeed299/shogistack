import React, { useState, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import ShogiBoard from './components/ShogiBoard';
import Komadai from './components/Komadai';
import { BoardState, Coordinates, Hand, Move, PieceType, Player } from './types';
import { createInitialBoard, isValidMove, promotePiece, applyMove, exportKIF } from './utils/shogiUtils';
import { EMPTY_HAND, SENTE_PROMOTION_ZONE, GOTE_PROMOTION_ZONE, PIECE_KANJI } from './constants';

const socket: Socket = io("http://localhost:3001", {
  transports: ['websocket', 'polling'],
  autoConnect: false,
});

type GameStatus = 'waiting' | 'playing' | 'finished' | 'analysis';
type Role = 'sente' | 'gote' | 'audience';

const App: React.FC = () => {
  // --- Connection State ---
  const [roomId, setRoomId] = useState<string>("");
  const [isAnalysisRoom, setIsAnalysisRoom] = useState(false);
  const [joined, setJoined] = useState(false);
  const [myRole, setMyRole] = useState<Role>('audience');
  const [readyStatus, setReadyStatus] = useState<{sente: boolean, gote: boolean}>({sente: false, gote: false});

  // --- View State ---
  const [isFlipped, setIsFlipped] = useState(false);

  // --- Game Data ---
  const [gameStatus, setGameStatus] = useState<GameStatus>('waiting');
  const [winner, setWinner] = useState<Player | null>(null);
  const [initialBoard] = useState<BoardState>(createInitialBoard());
  
  const [displayBoard, setDisplayBoard] = useState<BoardState>(createInitialBoard());
  const [displayHands, setDisplayHands] = useState<{ sente: Hand; gote: Hand }>({
    sente: { ...EMPTY_HAND }, gote: { ...EMPTY_HAND },
  });
  const [displayTurn, setDisplayTurn] = useState<Player>('sente'); 
  const [displayLastMove, setDisplayLastMove] = useState<{ from: Coordinates | 'hand'; to: Coordinates } | null>(null);

  const [history, setHistory] = useState<Move[]>([]);
  
  // --- UI State ---
  const [viewIndex, setViewIndex] = useState<number>(0); 
  const [selectedSquare, setSelectedSquare] = useState<Coordinates | null>(null);
  const [selectedHandPiece, setSelectedHandPiece] = useState<PieceType | null>(null);
  const [promotionCandidate, setPromotionCandidate] = useState<{ move: Move } | null>(null);

  // --- 盤面再生 ---
  const updateDisplay = useCallback((moves: Move[], index: number) => {
    let currentBoard = createInitialBoard();
    let currentHands = { sente: { ...EMPTY_HAND }, gote: { ...EMPTY_HAND } };
    let currentTurn: Player = 'sente';
    let lastM = null;

    for (let i = 0; i < index; i++) {
      const m = moves[i];
      if (!m) break;
      const res = applyMove(currentBoard, currentHands, m, currentTurn);
      currentBoard = res.board;
      currentHands = res.hands;
      currentTurn = res.turn;
      lastM = { from: m.from, to: m.to };
    }

    setDisplayBoard(currentBoard);
    setDisplayHands(currentHands);
    setDisplayTurn(currentTurn);
    setDisplayLastMove(lastM);
  }, []);

  useEffect(() => {
    updateDisplay(history, viewIndex);
  }, [history, viewIndex, updateDisplay]);

  // 自動反転ロジック
  useEffect(() => {
    if (gameStatus === 'playing') {
      setIsFlipped(myRole === 'gote');
    }
  }, [gameStatus, myRole]);


  // --- Socket Events ---
  useEffect(() => {
    if (!joined) return;

    socket.connect();
    socket.emit("join_room", { roomId, mode: isAnalysisRoom ? 'analysis' : 'normal' });

    socket.on("sync", (data: any) => {
      setHistory(data.history);
      setGameStatus(data.status);
      setWinner(data.winner);
      setReadyStatus(data.ready || {sente: false, gote: false});
      setViewIndex(data.history.length);
      
      if (data.yourRole) {
        setMyRole(data.yourRole);
      }
    });

    socket.on("ready_status", (ready: {sente: boolean, gote: boolean}) => {
      setReadyStatus(ready);
    });

    socket.on("game_started", () => {
      setHistory([]);
      setGameStatus('playing');
      setWinner(null);
      setViewIndex(0);
      alert("対局開始！お願いします。");
    });

    socket.on("game_finished", (data: { winner: Player }) => {
      setGameStatus('finished');
      setWinner(data.winner);
      alert(`終局！ ${data.winner === 'sente' ? '先手' : '後手'}の勝ち`);
    });

    socket.on("move", (move: Move) => {
      setHistory(prev => {
        const newHistory = [...prev, move];
        // 対局中は強制的に最新へ
        setViewIndex(newHistory.length); 
        return newHistory;
      });
    });

    return () => {
      socket.off("sync");
      socket.off("ready_status");
      socket.off("game_started");
      socket.off("game_finished");
      socket.off("move");
      socket.disconnect();
    };
  }, [joined, roomId]);


  // --- Actions ---

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) setJoined(true);
  };

  const toggleReady = () => {
    if (myRole === 'sente' || myRole === 'gote') {
      socket.emit("toggle_ready", { roomId, role: myRole });
    } else {
      alert("観戦者は準備できません");
    }
  };

  const resignGame = (loser: Player) => {
    if(window.confirm("本当に投了しますか？")) socket.emit("game_resign", { roomId, loser });
  };

  const processMove = (move: Move) => {
    if (gameStatus === 'waiting') return;
    
    // 対局中の制限
    if (gameStatus === 'playing') {
      if (myRole !== 'sente' && myRole !== 'gote') return;
      if (myRole !== displayTurn) return;
    }

    if (viewIndex !== history.length) {
      alert("最新の局面に戻ってください");
      return;
    }

    socket.emit("move", { roomId, move });
    const newHistory = [...history, move];
    setHistory(newHistory);
    setViewIndex(newHistory.length);
  };

  const requestUndo = () => {
    // 対局中はボタン自体消すのでここは念のため
    if (gameStatus === 'playing') return;
    if (history.length === 0) return;
    if(window.confirm("1手戻しますか？")) socket.emit("undo", roomId);
  };

  const requestReset = () => {
    if(window.confirm("初期化しますか？")) socket.emit("reset", roomId);
  };

  const copyKIF = () => {
    const kif = exportKIF(history, initialBoard);
    navigator.clipboard.writeText(kif).then(() => alert("KIFをコピーしました"));
  };

  // --- Click Handlers ---
  const handleSquareClick = (coords: Coordinates) => {
    if (gameStatus === 'waiting') return;

    const clickedPiece = displayBoard[coords.y][coords.x];

    if (clickedPiece?.owner === displayTurn) {
      setSelectedSquare(coords);
      setSelectedHandPiece(null);
      return;
    }

    if (selectedSquare) {
      const piece = displayBoard[selectedSquare.y][selectedSquare.x];
      if (!piece) return;

      const isEnteringZone = (displayTurn === 'sente' ? SENTE_PROMOTION_ZONE : GOTE_PROMOTION_ZONE).includes(coords.y);
      const isLeavingZone = (displayTurn === 'sente' ? SENTE_PROMOTION_ZONE : GOTE_PROMOTION_ZONE).includes(selectedSquare.y);
      const canPromote = !piece.isPromoted && (isEnteringZone || isLeavingZone) && 
                         piece.type !== PieceType.Gold && piece.type !== PieceType.King;
      
      const baseMove: Move = {
        from: selectedSquare,
        to: coords,
        piece: piece.type,
        drop: false
      };

      if (!isValidMove(displayBoard, displayTurn, baseMove)) return; 

      let mustPromote = false;
      if (displayTurn === 'sente') {
        if ((piece.type === PieceType.Pawn || piece.type === PieceType.Lance) && coords.y === 0) mustPromote = true;
        if (piece.type === PieceType.Knight && coords.y <= 1) mustPromote = true;
      } else {
        if ((piece.type === PieceType.Pawn || piece.type === PieceType.Lance) && coords.y === 8) mustPromote = true;
        if (piece.type === PieceType.Knight && coords.y >= 7) mustPromote = true;
      }

      if (mustPromote) {
        processMove({ ...baseMove, isPromoted: true });
        setSelectedSquare(null);
        return;
      }

      if (canPromote) {
        setPromotionCandidate({ move: baseMove });
        setSelectedSquare(null);
        return;
      }

      processMove({ ...baseMove, isPromoted: false });
      setSelectedSquare(null);
      return;
    }

    if (selectedHandPiece) {
      if (clickedPiece === null) {
        const move: Move = {
          from: 'hand',
          to: coords,
          piece: selectedHandPiece,
          drop: true
        };
        if (isValidMove(displayBoard, displayTurn, move)) {
          processMove(move);
        }
        setSelectedHandPiece(null);
      }
    }
  };

  const handleHandPieceClick = (piece: PieceType, owner: Player) => {
    if (gameStatus === 'waiting') return;
    if (owner !== displayTurn) return;
    setSelectedHandPiece(piece);
    setSelectedSquare(null);
  };

  const handlePromotionChoice = (promote: boolean) => {
    if (!promotionCandidate) return;
    processMove({ ...promotionCandidate.move, isPromoted: promote });
    setPromotionCandidate(null);
  };

  // --- Render ---
  if (!joined) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <form onSubmit={handleJoin} className="bg-stone-800 p-8 rounded-lg shadow-xl border border-amber-700/30 max-w-sm w-full space-y-4">
          <h1 className="text-2xl font-bold text-amber-100 text-center font-serif">将棋コネクト</h1>
          <div>
            <label className="block text-stone-400 text-sm mb-2">ルーム名</label>
            <input 
              type="text" value={roomId} onChange={(e) => setRoomId(e.target.value)}
              className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2 text-white"
              placeholder="room1"
            />
          </div>
          <div className="flex items-center gap-3 p-3 bg-stone-900/50 rounded border border-stone-700">
             <input type="checkbox" id="analysisMode" checked={isAnalysisRoom} onChange={(e) => setIsAnalysisRoom(e.target.checked)} className="w-5 h-5 accent-amber-600" />
             <label htmlFor="analysisMode" className="text-stone-300 text-sm cursor-pointer">検討室モード</label>
          </div>
          <button type="submit" className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-3 rounded">入室する</button>
        </form>
      </div>
    );
  }

  const BottomHand = isFlipped ? displayHands.gote : displayHands.sente;
  const BottomOwner = isFlipped ? 'gote' : 'sente';
  const TopHand = isFlipped ? displayHands.sente : displayHands.gote;
  const TopOwner = isFlipped ? 'sente' : 'gote';

  // 役割表示名
  const getRoleName = (r: Role) => r === 'sente' ? '先手' : r === 'gote' ? '後手' : '観戦';

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-2 gap-2 touch-none relative">
      
      {promotionCandidate && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-stone-800 p-6 rounded-xl border border-amber-600 shadow-2xl flex flex-col gap-4 items-center">
            <h3 className="text-amber-100 text-lg font-bold">成りますか？</h3>
            <div className="flex gap-4">
              <button onClick={() => handlePromotionChoice(true)} className="bg-amber-600 text-white font-bold py-3 px-6 rounded-lg">成る</button>
              <button onClick={() => handlePromotionChoice(false)} className="bg-stone-600 text-stone-200 font-bold py-3 px-6 rounded-lg">成らない</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="w-full max-w-lg flex justify-between items-start text-stone-400 text-sm px-1">
        <div className="flex flex-col gap-1">
          <div>Room: <span className="text-amber-200 font-mono">{roomId}</span></div>
          <div className="text-xs text-stone-500">
             あなた: <span className="font-bold text-stone-300 text-base">{getRoleName(myRole)}</span>
          </div>
        </div>
        
        {/* タイマー表示 (UIのみ) */}
        <div className="flex gap-2">
            <div className={`flex flex-col items-end px-2 py-1 rounded border-r-4 ${displayTurn === 'gote' ? 'bg-stone-800 border-amber-500' : 'border-stone-800 opacity-50'}`}>
                <span className="text-[10px]">後手</span>
                <span className="font-mono font-bold text-stone-200">10:00 <span className="text-[10px] text-stone-400">60</span></span>
            </div>
            <div className={`flex flex-col items-end px-2 py-1 rounded border-l-4 ${displayTurn === 'sente' ? 'bg-stone-800 border-amber-500' : 'border-stone-800 opacity-50'}`}>
                <span className="text-[10px]">先手</span>
                <span className="font-mono font-bold text-stone-200">10:00 <span className="text-[10px] text-stone-400">60</span></span>
            </div>
        </div>
      </div>

      {/* Top Hand */}
      <div className="w-full max-w-lg">
        <Komadai 
          hand={TopHand} owner={TopOwner} 
          isCurrentTurn={displayTurn === TopOwner} 
          onSelectPiece={(p) => handleHandPieceClick(p, TopOwner)} 
          selectedPiece={displayTurn === TopOwner ? selectedHandPiece : null}
        />
      </div>

      {/* Board */}
      <div className="w-full max-w-lg relative" style={{ transition: 'transform 0.5s', transform: isFlipped ? 'rotate(180deg)' : 'none' }}>
        <ShogiBoard 
          board={displayBoard} 
          onSquareClick={handleSquareClick}
          selectedSquare={selectedSquare}
          validMoves={[]} 
          lastMove={displayLastMove}
          turn={displayTurn}
        />
        
        {/* 対局待ちオーバーレイ */}
        {gameStatus === 'waiting' && (
           <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 backdrop-blur-[2px]" 
                style={{ transform: isFlipped ? 'rotate(180deg)' : 'none' }}>
             <div className="bg-stone-900/90 p-6 rounded-xl border border-amber-600 shadow-2xl text-center w-64">
               <h2 className="text-amber-100 font-bold text-xl mb-4">対局準備</h2>
               
               {(myRole === 'sente' || myRole === 'gote') ? (
                 <div className="flex flex-col gap-3">
                   <button 
                     onClick={toggleReady} 
                     className={`font-bold py-3 px-6 rounded-full shadow-lg transition-all active:scale-95
                       ${readyStatus[myRole] 
                         ? 'bg-green-600 text-white hover:bg-green-500 ring-2 ring-green-400' 
                         : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                       }`}
                   >
                     {readyStatus[myRole] ? "準備完了！" : "準備完了を押す"}
                   </button>
                   
                   <div className="text-xs text-stone-400 mt-2">
                     <div>相手の状況:</div>
                     <div className={`font-bold ${readyStatus[myRole === 'sente' ? 'gote' : 'sente'] ? 'text-green-400' : 'text-stone-500'}`}>
                       {readyStatus[myRole === 'sente' ? 'gote' : 'sente'] ? "準備OK" : "待機中..."}
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="text-stone-400">対局者の準備を待っています...</div>
               )}
             </div>
           </div>
        )}
      </div>

      {/* Bottom Hand */}
      <div className="w-full max-w-lg">
        <Komadai 
          hand={BottomHand} owner={BottomOwner} 
          isCurrentTurn={displayTurn === BottomOwner} 
          onSelectPiece={(p) => handleHandPieceClick(p, BottomOwner)} 
          selectedPiece={displayTurn === BottomOwner ? selectedHandPiece : null}
        />
      </div>

      {/* Footer Controls */}
      <div className="w-full max-w-lg flex flex-col gap-2 mt-1">
        
        {/* 手数ナビ (対局中は非表示) */}
        {gameStatus !== 'playing' ? (
          <div className="flex items-center justify-between bg-stone-900/50 p-2 rounded border border-stone-800">
            <div className="flex gap-2 items-center">
              <div className="text-stone-400 text-xs font-mono">{viewIndex}手目</div>
              <button onClick={() => setIsFlipped(!isFlipped)} className="bg-stone-700 text-stone-300 px-2 py-0.5 rounded text-[10px]">反転</button>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setViewIndex(Math.max(0, viewIndex - 1))} className="bg-stone-700 text-stone-200 px-3 py-1 rounded text-xs">◀</button>
              <button onClick={() => setViewIndex(Math.min(history.length, viewIndex + 1))} className="bg-stone-700 text-stone-200 px-3 py-1 rounded text-xs">▶</button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center p-2 text-stone-500 text-xs font-mono border border-transparent">
             {/* 対局中は手数だけシンプルに表示 */}
             {viewIndex}手目
          </div>
        )}

        {/* ツールバー */}
        <div className="flex justify-between items-center px-1">
           <button onClick={copyKIF} className="text-stone-500 hover:text-white text-xs underline">KIFコピー</button>

           <div className="flex gap-2">
             {/* 対局中の投了ボタン */}
             {gameStatus === 'playing' && (myRole === 'sente' || myRole === 'gote') && (
                <button onClick={() => resignGame(myRole)} className="bg-stone-800 text-stone-400 border border-stone-600 px-4 py-2 rounded text-xs hover:bg-stone-700 hover:text-white">
                  投了する
                </button>
             )}

             {/* 感想戦・検討モードの機能 */}
             {(gameStatus === 'finished' || gameStatus === 'analysis') && (
               <>
                 <button onClick={requestUndo} className="bg-stone-700 text-stone-300 px-3 py-1 rounded text-xs">1手戻す</button>
                 <button onClick={requestReset} className="bg-red-900/30 text-red-300 px-3 py-1 rounded text-xs">リセット</button>
               </>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;