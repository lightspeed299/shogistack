// src/types.ts

// 既存の型定義（もしあればそのまま維持）
export type Player = 'sente' | 'gote';

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
  Horse = 'Horse',
  Dragon = 'Dragon'
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface Piece {
  type: PieceType;
  owner: Player;
  isPromoted: boolean;
}

export type BoardState = (Piece | null)[][];

export type Hand = {
  [key in PieceType]: number;
};

export interface Move {
  from: Coordinates | 'hand';
  to: Coordinates;
  piece: PieceType;
  drop: boolean;
  isPromoted: boolean;
  time?: { now: number; total: number };
  isCheck?: boolean;
}

// ★ここから下を追加してください（今回のエラーの原因）★

export type GameStatus = 'waiting' | 'playing' | 'finished' | 'analysis';

export type Role = 'sente' | 'gote' | 'audience';

export interface TimeSettings {
  initial: number;
  byoyomi: number;
  randomTurn: boolean;
  fixTurn: boolean;
}