import { PieceType } from './types';

// Kanji Mapping
export const PIECE_KANJI: Record<PieceType, string> = {
  [PieceType.Pawn]: '歩',
  [PieceType.PromotedPawn]: 'と',
  [PieceType.Lance]: '香',
  [PieceType.PromotedLance]: '杏', // 成香 -> 杏
  [PieceType.Knight]: '桂',
  [PieceType.PromotedKnight]: '圭', // 成桂 -> 圭
  [PieceType.Silver]: '銀',
  [PieceType.PromotedSilver]: '全', // 成銀 -> 全
  [PieceType.Gold]: '金',
  [PieceType.Bishop]: '角',
  [PieceType.Horse]: '馬',
  [PieceType.Rook]: '飛',
  [PieceType.Dragon]: '龍',
  [PieceType.King]: '玉',
};

// Initial Hands
export const EMPTY_HAND = {
  [PieceType.Pawn]: 0,
  [PieceType.Lance]: 0,
  [PieceType.Knight]: 0,
  [PieceType.Silver]: 0,
  [PieceType.Gold]: 0,
  [PieceType.Bishop]: 0,
  [PieceType.Rook]: 0,
  [PieceType.King]: 0,
  [PieceType.PromotedPawn]: 0,
  [PieceType.PromotedLance]: 0,
  [PieceType.PromotedKnight]: 0,
  [PieceType.PromotedSilver]: 0,
  [PieceType.Horse]: 0,
  [PieceType.Dragon]: 0,
};

// Promotion Zone Y-coordinates
export const SENTE_PROMOTION_ZONE = [0, 1, 2];
export const GOTE_PROMOTION_ZONE = [6, 7, 8];

// Mapping to SFEN standard piece letters
export const SFEN_MAP: Record<PieceType, string> = {
  [PieceType.Pawn]: 'p',
  [PieceType.Lance]: 'l',
  [PieceType.Knight]: 'n',
  [PieceType.Silver]: 's',
  [PieceType.Gold]: 'g',
  [PieceType.Bishop]: 'b',
  [PieceType.Rook]: 'r',
  [PieceType.King]: 'k',
  [PieceType.PromotedPawn]: '+p',
  [PieceType.PromotedLance]: '+l',
  [PieceType.PromotedKnight]: '+n',
  [PieceType.PromotedSilver]: '+s',
  [PieceType.Horse]: '+b',
  [PieceType.Dragon]: '+r',
};