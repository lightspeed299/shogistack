import React, { useState, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import ShogiBoard from './components/ShogiBoard';
import Komadai from './components/Komadai';
import { BoardState, Coordinates, Hand, Move, PieceType, Player } from './types';
import { createInitialBoard, isValidMove, promotePiece, applyMove, exportKIF } from './utils/shogiUtils'; // exportKIFを追加
import { EMPTY_HAND, SENTE_PROMOTION_ZONE, GOTE_PROMOTION_ZONE, PIECE_KANJI } from './constants';

const socket: Socket = io("http://localhost:3001", {
  transports: ['websocket', 'polling'],
  autoConnect: false, // ルームIDが決まるまで接続しない
});

const App: React.FC = () => {
  // --- Room State ---
  const [roomId, setRoomId] = useState<string>("");
  const [joined, setJoined] = useState(false);

  // --- Game State ---
  const [initialBoard] = useState<BoardState>(createInitialBoard()); // 基準となる初期配置
  
  // 表示用の状態（計算結果）
  const [displayBoard, setDisplayBoard] = useState<BoardState>(createInitialBoard());
  const [displayHands, setDisplayHands] = useState<{ sente: Hand; gote: Hand }>({
    sente: { ...EMPTY_HAND }, gote: { ...EMPTY_HAND },
  });
  const [displayTurn, setDisplayTurn] = useState<Player>('sente'); 
  const [displayLastMove, setDisplayLastMove] = useState<{ from: Coordinates | 'hand'; to: Coordinates } | null>(null);

  // 履歴データ（これが正）
  const [history, setHistory] = useState<Move[]>([]);
  
  // --- UI Modes ---
  const [mode, setMode] = useState<'game' | 'analysis'>('game');
  const [viewIndex, setViewIndex] = useState<number>(0); // 検討モードで今何手目を見ているか

  const [selectedSquare, setSelectedSquare] = useState<Coordinates | null>(null);
  const [selectedHandPiece, setSelectedHandPiece] = useState<PieceType | null>(null);
  const [promotionCandidate, setPromotionCandidate] = useState<{ move: Move } | null>(null);

  // --- 盤面再計算ロジック ---
  // 履歴と「何手目まで見るか」を渡すと、その時点の盤面を作ってセットする
  const updateDisplay = useCallback((moves: Move[], index: number) => {
    let currentBoard = createInitialBoard();
    let currentHands = { sente: { ...EMPTY_HAND }, gote: { ...EMPTY_HAND } };
    let currentTurn: Player = 'sente';
    let lastM = null;

    // 指定した手数まで再生
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

  // 履歴か表示位置が変わったら盤面を更新
  useEffect(() => {
    updateDisplay(history, viewIndex);
  }, [history, viewIndex, updateDisplay]);


  // --- Socket Events ---
  useEffect(() => {
    if (!joined) return;

    socket.connect();
    socket.emit("join_room", roomId);

    socket.on("sync", (serverHistory: Move[]) => {
      console.log("同期:", serverHistory.length);
      setHistory(serverHistory);
      // 最新の局面にジャンプ
      setViewIndex(serverHistory.length);
    });

    socket.on("move", (move: Move) => {
      setHistory(prev => {
        const newHistory = [...prev, move];
        // 対局モードなら自動で最新局面に追従
        // 検討モードでも、自分が最新を見ているなら追従してもいいかも（今回は強制追従）
        setViewIndex(newHistory.length); 
        return newHistory;
      });
    });

    socket.on("reset", () => {
      setHistory([]);
      setViewIndex(0);
    });

    return () => {
      socket.off("sync");
      socket.off("move");
      socket.off("reset");
      socket.disconnect();
    };
  }, [joined, roomId]);


  // --- Actions ---

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) setJoined(true);
  };

  const processMove = (move: Move) => {
    // 検討モードで過去を見ている時は指せない（あるいはブランチを作るなど高度な処理が必要）
    // 今回は「最新局面を見ている時だけ指せる」制限にする
    if (viewIndex !== history.length) {
      alert("過去の局面からは指せません。\n「進む」で最新の局面に戻ってください。");
      return;
    }

    // サーバーへ送信（部屋ID付き）
    socket.emit("move", { roomId, move });

    // 自分の画面も即時更新
    const newHistory = [...history, move];
    setHistory(newHistory);
    setViewIndex(newHistory.length);
  };

  const requestUndo = () => {
    if (history.length === 0) return;
    if (window.confirm("待ったをしますか？（相手にも反映されます）")) {
      socket.emit("undo", roomId);
    }
  };

  const requestReset = () => {
    if (window.confirm("盤面を初期化しますか？")) {
      socket.emit("reset", roomId);
    }
  };

  const copyKIF = () => {
    const kif = exportKIF(history, initialBoard);
    navigator.clipboard.writeText(kif).then(() => {
      alert("棋譜(KIF形式)をクリップボードにコピーしました！");
    });
  };

  // --- Click Handlers ---
  // (基本ロジックは以前と同じだが、参照先が displayBoard 等になる)
  const handleSquareClick = (coords: Coordinates) => {
    // 自分の手番でなければ操作無効（対局モード時）
    // ※単純化のため、今回は「検討モード」なら手番関係なく動かせる等の制御はせず、
    // 「最新局面なら誰でも動かせる」仕様のままにします。
    
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
      
      let mustPromote = false;
      if (displayTurn === 'sente') {
        if ((piece.type === PieceType.Pawn || piece.type === PieceType.Lance) && coords.y === 0) mustPromote = true;
        if (piece.type === PieceType.Knight && coords.y <= 1) mustPromote = true;
      } else {
        if ((piece.type === PieceType.Pawn || piece.type === PieceType.Lance) && coords.y === 8) mustPromote = true;
        if (piece.type === PieceType.Knight && coords.y >= 7) mustPromote = true;
      }

      const baseMove: Move = {
        from: selectedSquare,
        to: coords,
        piece: piece.type,
        drop: false
      };

      if (!isValidMove(displayBoard, displayTurn, baseMove)) return; 

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
    if (owner !== displayTurn) return;
    setSelectedHandPiece(piece);
    setSelectedSquare(null);
  };

  const handlePromotionChoice = (promote: boolean) => {
    if (!promotionCandidate) return;
    processMove({ ...promotionCandidate.move, isPromoted: promote });
    setPromotionCandidate(null);
  };

  // --- Render: Login Screen ---
  if (!joined) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <form onSubmit={handleJoin} className="bg-stone-800 p-8 rounded-lg shadow-xl border border-amber-700/30 max-w-sm w-full">
          <h1 className="text-2xl font-bold text-amber-100 mb-6 text-center font-serif">Shogi Connect</h1>
          <div className="mb-4">
            <label className="block text-stone-400 text-sm mb-2">ルームID (合言葉)</label>
            <input 
              type="text" 
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2 text-white focus:border-amber-500 outline-none"
              placeholder="room1"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-2 rounded transition-colors"
          >
            入室する
          </button>
        </form>
      </div>
    );
  }

  // --- Render: Main Game ---
  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-2 gap-4 touch-none relative">
      
      {/* 成りダイアログ */}
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

      {/* Header Info */}
      <div className="w-full max-w-lg flex justify-between items-center text-stone-400 text-sm px-2">
        <div>Room: <span className="text-amber-200 font-mono">{roomId}</span></div>
        <div className="flex gap-2 bg-stone-800 rounded p-1">
          <button 
            onClick={() => setMode('game')}
            className={`px-3 py-1 rounded text-xs transition-colors ${mode === 'game' ? 'bg-amber-700 text-white' : 'hover:bg-stone-700'}`}
          >
            対局
          </button>
          <button 
             onClick={() => setMode('analysis')}
             className={`px-3 py-1 rounded text-xs transition-colors ${mode === 'analysis' ? 'bg-green-800 text-white' : 'hover:bg-stone-700'}`}
          >
            検討
          </button>
        </div>
      </div>

      {/* Gote Hand */}
      <div className="w-full max-w-lg">
        <Komadai 
          hand={displayHands.gote} owner="gote" 
          isCurrentTurn={displayTurn === 'gote'} 
          onSelectPiece={(p) => handleHandPieceClick(p, 'gote')} 
          selectedPiece={displayTurn === 'gote' ? selectedHandPiece : null}
        />
      </div>

      {/* Board */}
      <div className="w-full max-w-lg">
        <ShogiBoard 
          board={displayBoard} 
          onSquareClick={handleSquareClick}
          selectedSquare={selectedSquare}
          validMoves={[]} 
          lastMove={displayLastMove}
          turn={displayTurn}
        />
      </div>

      {/* Sente Hand */}
      <div className="w-full max-w-lg">
        <Komadai 
          hand={displayHands.sente} owner="sente" 
          isCurrentTurn={displayTurn === 'sente'} 
          onSelectPiece={(p) => handleHandPieceClick(p, 'sente')} 
          selectedPiece={displayTurn === 'sente' ? selectedHandPiece : null}
        />
      </div>

      {/* Control Footer */}
      <div className="w-full max-w-lg flex flex-col gap-2 mt-2">
        
        {/* 手数表示と操作ボタン */}
        <div className="flex items-center justify-between bg-stone-900/50 p-2 rounded border border-stone-800">
          <div className="text-stone-400 text-xs font-mono">
            {viewIndex}手目 / {history.length}手
            {mode === 'game' && <span className="ml-2 text-amber-500">TEBAN: {displayTurn.toUpperCase()}</span>}
          </div>

          <div className="flex gap-1">
            {mode === 'analysis' ? (
              // 検討モードの操作ボタン
              <>
                <button 
                  onClick={() => setViewIndex(Math.max(0, viewIndex - 1))}
                  disabled={viewIndex === 0}
                  className="bg-stone-700 disabled:opacity-30 text-stone-200 px-3 py-1 rounded text-xs"
                >
                  ◀ 戻る
                </button>
                <button 
                  onClick={() => setViewIndex(Math.min(history.length, viewIndex + 1))}
                  disabled={viewIndex === history.length}
                  className="bg-stone-700 disabled:opacity-30 text-stone-200 px-3 py-1 rounded text-xs"
                >
                  進む ▶
                </button>
                <button 
                  onClick={() => setViewIndex(history.length)}
                  disabled={viewIndex === history.length}
                  className="bg-stone-700 disabled:opacity-30 text-stone-200 px-3 py-1 rounded text-xs"
                >
                  最新
                </button>
              </>
            ) : (
              // 対局モードの操作ボタン
              <button 
                onClick={requestUndo}
                className="bg-stone-700 hover:bg-stone-600 text-stone-300 px-4 py-1 rounded text-xs"
              >
                待った
              </button>
            )}
          </div>
        </div>

        {/* ツールボタン */}
        <div className="flex justify-end gap-2">
           <button onClick={copyKIF} className="text-stone-400 hover:text-white text-xs underline">
             棋譜出力(KIF)
           </button>
           <button onClick={requestReset} className="text-red-900 hover:text-red-500 text-xs underline">
             リセット
           </button>
        </div>
      </div>

    </div>
  );
};

export default App;