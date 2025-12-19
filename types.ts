export type Player = 'sente' | 'gote'; // Sente (Black/First), Gote (White/Second)

export enum PieceType {
  Pawn = 'Pawn',
  Lance = 'Lance',
  Knight = 'Knight',
  Silver = 'Silver',
  Gold = 'Gold',
  Bishop = 'Bishop',
  Rook = 'Rook',
  King = 'King',
  PromotedPawn = 'PromotedPawn',
  PromotedLance = 'PromotedLance',
  PromotedKnight = 'PromotedKnight',
  PromotedSilver = 'PromotedSilver',
  Horse = 'Horse', // Promoted Bishop
  Dragon = 'Dragon', // Promoted Rook
}

export interface Piece {
  type: PieceType;
  owner: Player;
  isPromoted: boolean;
}

export type BoardState = (Piece | null)[][]; // 9x9 grid

export interface Coordinates {
  x: number; // 0-8, corresponding to 9-1 in Shogi coords
  y: number; // 0-8, corresponding to a-i (1-9) in Shogi coords
}

export interface Move {
  from: Coordinates | 'hand';
  to: Coordinates;
  piece: PieceType;
  isPromoted?: boolean;
  drop?: boolean;
}

export interface Hand {
  [PieceType.Pawn]: number;
  [PieceType.Lance]: number;
  [PieceType.Knight]: number;
  [PieceType.Silver]: number;
  [PieceType.Gold]: number;
  [PieceType.Bishop]: number;
  [PieceType.Rook]: number;
  // King and Promoted pieces don't exist in hand
  [PieceType.King]: number;
  [PieceType.PromotedPawn]: number;
  [PieceType.PromotedLance]: number;
  [PieceType.PromotedKnight]: number;
  [PieceType.PromotedSilver]: number;
  [PieceType.Horse]: number;
  [PieceType.Dragon]: number;
}
