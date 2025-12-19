// ▼ ここに Hand を追加しました
import { BoardState, Piece, PieceType, Player, Coordinates, Move, Hand } from '../types';
import { SFEN_MAP } from '../constants';

export const createInitialBoard = (): BoardState => {
  // 9x9 grid, null represents empty space
  const board: BoardState = Array(9).fill(null).map(() => Array(9).fill(null));

  const place = (x: number, y: number, type: PieceType, owner: Player) => {
    board[y][x] = { type, owner, isPromoted: false };
  };

  // Setup Gote (Top)
  place(0, 0, PieceType.Lance, 'gote');
  place(1, 0, PieceType.Knight, 'gote');
  place(2, 0, PieceType.Silver, 'gote');
  place(3, 0, PieceType.Gold, 'gote');
  place(4, 0, PieceType.King, 'gote');
  place(5, 0, PieceType.Gold, 'gote');
  place(6, 0, PieceType.Silver, 'gote');
  place(7, 0, PieceType.Knight, 'gote');
  place(8, 0, PieceType.Lance, 'gote');
  place(1, 1, PieceType.Rook, 'gote');
  place(7, 1, PieceType.Bishop, 'gote');
  for (let i = 0; i < 9; i++) place(i, 2, PieceType.Pawn, 'gote');

  // Setup Sente (Bottom)
  place(0, 8, PieceType.Lance, 'sente');
  place(1, 8, PieceType.Knight, 'sente');
  place(2, 8, PieceType.Silver, 'sente');
  place(3, 8, PieceType.Gold, 'sente');
  place(4, 8, PieceType.King, 'sente');
  place(5, 8, PieceType.Gold, 'sente');
  place(6, 8, PieceType.Silver, 'sente');
  place(7, 8, PieceType.Knight, 'sente');
  place(8, 8, PieceType.Lance, 'sente');
  place(7, 7, PieceType.Rook, 'sente');
  place(1, 7, PieceType.Bishop, 'sente');
  for (let i = 0; i < 9; i++) place(i, 6, PieceType.Pawn, 'sente');

  return board;
};

export const boardToSFEN = (board: BoardState, turn: Player, hands: any): string => {
  let sfen = "";
  
  for (let y = 0; y < 9; y++) {
    let emptyCount = 0;
    for (let x = 0; x < 9; x++) {
      const piece = board[y][x];
      if (piece === null) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          sfen += emptyCount.toString();
          emptyCount = 0;
        }
        let char = SFEN_MAP[piece.type];
        if (piece.owner === 'sente') {
          char = char.toUpperCase();
        } else {
          char = char.toLowerCase();
        }
        sfen += char;
      }
    }
    if (emptyCount > 0) {
      sfen += emptyCount.toString();
    }
    if (y < 8) {
      sfen += "/";
    }
  }

  sfen += ` ${turn === 'sente' ? 'b' : 'w'}`;
  return sfen;
};

export const getReversePieceType = (type: PieceType): PieceType => {
  switch (type) {
    case PieceType.PromotedPawn: return PieceType.Pawn;
    case PieceType.PromotedLance: return PieceType.Lance;
    case PieceType.PromotedKnight: return PieceType.Knight;
    case PieceType.PromotedSilver: return PieceType.Silver;
    case PieceType.Horse: return PieceType.Bishop;
    case PieceType.Dragon: return PieceType.Rook;
    default: return type;
  }
};

const hasObstacle = (x1: number, y1: number, x2: number, y2: number, board: BoardState): boolean => {
  const dx = Math.sign(x2 - x1);
  const dy = Math.sign(y2 - y1);
  
  let x = x1 + dx;
  let y = y1 + dy;
  
  while (x !== x2 || y !== y2) {
    if (board[y][x] !== null) return true;
    x += dx;
    y += dy;
  }
  return false;
};

export const isValidMove = (
  board: BoardState,
  currentTurn: Player,
  move: Move
): boolean => {
  const { from, to, piece, drop } = move;

  const targetPiece = board[to.y][to.x];
  if (targetPiece && targetPiece.owner === currentTurn) {
    return false;
  }

  if (drop) {
    if (targetPiece !== null) return false;
    
    if (piece === PieceType.Pawn) {
      for (let y = 0; y < 9; y++) {
        const p = board[y][to.x];
        if (p && p.owner === currentTurn && p.type === PieceType.Pawn && !p.isPromoted) {
          return false;
        }
      }
    }
    
    if (currentTurn === 'sente') {
      if (piece === PieceType.Pawn || piece === PieceType.Lance) {
        if (to.y === 0) return false;
      }
      if (piece === PieceType.Knight) {
        if (to.y <= 1) return false;
      }
    } else {
      if (piece === PieceType.Pawn || piece === PieceType.Lance) {
        if (to.y === 8) return false;
      }
      if (piece === PieceType.Knight) {
        if (to.y >= 7) return false;
      }
    }

    return true;
  }

  if (typeof from === 'string') return false;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  const forward = currentTurn === 'sente' ? -1 : 1; 

  const checkMovement = (type: PieceType, promoted: boolean): boolean => {
    const goldMove = () => {
      const absDx = Math.abs(dx);
      if ((absDx === 1 && dy === 0) || (absDx === 0 && Math.abs(dy) === 1)) return true;
      if (absDx === 1 && dy === forward) return true;
      return false;
    };

    switch (type) {
      case PieceType.Pawn:
        return !promoted ? (dx === 0 && dy === forward) : goldMove();
        
      case PieceType.King:
        return Math.abs(dx) <= 1 && Math.abs(dy) <= 1;

      case PieceType.Gold:
      case PieceType.PromotedPawn:
      case PieceType.PromotedLance:
      case PieceType.PromotedKnight:
      case PieceType.PromotedSilver:
        return goldMove();

      case PieceType.Silver:
        if (promoted) return goldMove();
        if (Math.abs(dx) <= 1 && dy === forward) return true; 
        if (Math.abs(dx) === 1 && dy === -forward) return true; 
        return false;

      case PieceType.Knight:
        if (promoted) return goldMove();
        return Math.abs(dx) === 1 && dy === (forward * 2);

      case PieceType.Lance:
        if (promoted) return goldMove();
        if (dx !== 0) return false;
        if (currentTurn === 'sente' ? (dy >= 0) : (dy <= 0)) return false; 
        return !hasObstacle(from.x, from.y, to.x, to.y, board);

      case PieceType.Bishop:
      case PieceType.Horse:
        if (Math.abs(dx) === Math.abs(dy)) {
           if (hasObstacle(from.x, from.y, to.x, to.y, board)) return false;
           return true;
        }
        if (promoted && (Math.abs(dx) + Math.abs(dy) === 1)) return true;
        return false;

      case PieceType.Rook:
      case PieceType.Dragon:
        if (dx === 0 || dy === 0) {
           if (hasObstacle(from.x, from.y, to.x, to.y, board)) return false;
           return true;
        }
        if (promoted && Math.abs(dx) <= 1 && Math.abs(dy) <= 1) return true;
        return false;
        
      default:
        return false;
    }
  };

  const movingPiece = board[from.y][from.x];
  if (!movingPiece) return false;

  return checkMovement(movingPiece.type, movingPiece.isPromoted);
};

export const promotePiece = (type: PieceType): PieceType => {
  switch (type) {
    case PieceType.Pawn: return PieceType.PromotedPawn;
    case PieceType.Lance: return PieceType.PromotedLance;
    case PieceType.Knight: return PieceType.PromotedKnight;
    case PieceType.Silver: return PieceType.PromotedSilver;
    case PieceType.Bishop: return PieceType.Horse;
    case PieceType.Rook: return PieceType.Dragon;
    default: return type;
  }
};

export const applyMove = (
  currentBoard: BoardState, 
  currentHands: { sente: Hand, gote: Hand }, 
  move: Move,
  currentTurn: Player
): { board: BoardState, hands: { sente: Hand, gote: Hand }, turn: Player } => {
  
  const newBoard = currentBoard.map(row => [...row]);
  const newHands = { 
    sente: { ...currentHands.sente }, 
    gote: { ...currentHands.gote } 
  };
  const nextTurn = currentTurn === 'sente' ? 'gote' : 'sente';

  if (move.drop && move.from === 'hand') {
    newBoard[move.to.y][move.to.x] = {
      type: move.piece,
      owner: currentTurn,
      isPromoted: false
    };
    newHands[currentTurn][move.piece]--;
  } 
  else if (typeof move.from !== 'string') {
    const piece = newBoard[move.from.y][move.from.x];
    if (!piece) return { board: newBoard, hands: newHands, turn: nextTurn };

    const targetSquare = newBoard[move.to.y][move.to.x];
    if (targetSquare) {
      const capturedType = getReversePieceType(targetSquare.type);
      newHands[currentTurn][capturedType]++;
    }

    const newType = move.isPromoted ? promotePiece(piece.type) : piece.type;

    newBoard[move.to.y][move.to.x] = {
      ...piece,
      type: newType,
      isPromoted: move.isPromoted ? true : piece.isPromoted
    };
    newBoard[move.from.y][move.from.x] = null;
  }

  return { board: newBoard, hands: newHands, turn: nextTurn };
};
// ... (上のコードはそのまま)

// ★追加: 履歴をKIF形式のテキストに変換する
import { PIECE_KANJI } from '../constants';

export const exportKIF = (history: Move[], initialBoard: BoardState): string => {
  const now = new Date();
  const dateStr = `${now.getFullYear()}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getDate().toString().padStart(2,'0')}`;
  
  let kif = `# KIF output generated by ShogiConnect\n`;
  kif += `開始日時：${dateStr}\n`;
  kif += `手合割：平手\n`;
  kif += `先手：先手\n`;
  kif += `後手：後手\n`;
  kif += `手数----指手---------消費時間--\n`;

  // 座標変換ヘルパー (0-8 -> 9-1, 一-九)
  const toX = (x: number) => 9 - x;
  const numToKanji = ['〇','一','二','三','四','五','六','七','八','九'];
  const toY = (y: number) => numToKanji[y + 1];

  history.forEach((move, index) => {
    const num = index + 1;
    let moveStr = "";

    // 移動先
    const destX = toX(move.to.x);
    const destY = toY(move.to.y);
    
    // 同・　の表記（今回は簡易的に常に座標を書くことにします）
    moveStr += `${destX}${destY}`;

    // 駒名
    const pieceName = PIECE_KANJI[move.piece];
    moveStr += pieceName;

    // 成り
    if (move.isPromoted) moveStr += "成";

    // 移動元
    if (move.drop) {
      moveStr += "打";
    } else if (typeof move.from !== 'string') {
      const srcX = toX(move.from.x);
      const srcY = move.from.y + 1; // 数字
      moveStr += `(${srcX}${srcY})`;
    }

    kif += `${String(num).padStart(4, ' ')} ${moveStr}\n`;
  });

  return kif;
};