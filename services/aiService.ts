import { GoogleGenAI, Type } from "@google/genai";
import { BoardState, Player, Hand, Move, PieceType } from "../types";
import { boardToSFEN } from "../utils/shogiUtils";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// This service simulates the "Home Server" processing.
// In a real deployment, this would be a fetch() call to the user's local IP (e.g., http://192.168.1.100:5000/engine)
export const getBestMove = async (
  board: BoardState,
  turn: Player,
  hands: { sente: Hand; gote: Hand }
): Promise<Move> => {
  const sfen = boardToSFEN(board, turn, hands);
  
  const handString = (player: Player, hand: Hand) => {
    return Object.entries(hand)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => `${type}:${count}`)
      .join(", ");
  };

  const context = `
    Current Board (SFEN): ${sfen}
    Sente Hand: ${handString('sente', hands.sente)}
    Gote Hand: ${handString('gote', hands.gote)}
    Current Turn: ${turn.toUpperCase()}
  `;

  const systemInstruction = `
    You are a professional Shogi engine running on a home server. 
    Analyze the provided board state and determine the single best legal move for the current player.
    
    Coordinates Rule:
    The board is 9x9.
    x: 0 is the left-most column (9 in shogi), x: 8 is the right-most column (1 in shogi).
    y: 0 is the top row (a/1), y: 8 is the bottom row (i/9).
    
    Output JSON format only.
    If dropping a piece from hand: set "drop" to true, "from" to "hand", and "piece" to the piece type.
    If moving a piece on board: set "drop" to false, "from" object with x,y, "to" object with x,y.
    
    If the move promotes a piece (entering promotion zone), set "isPromoted" to true.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: context,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            from: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.INTEGER },
                y: { type: Type.INTEGER },
                sourceType: { type: Type.STRING, enum: ["board", "hand"] }
              },
              required: ["sourceType"]
            },
            to: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.INTEGER },
                y: { type: Type.INTEGER }
              },
              required: ["x", "y"]
            },
            piece: { type: Type.STRING },
            isPromoted: { type: Type.BOOLEAN },
            drop: { type: Type.BOOLEAN }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    const parsed = JSON.parse(jsonText);
    
    // Normalize response to our internal Move type
    const move: Move = {
        to: { x: parsed.to.x, y: parsed.to.y },
        from: parsed.drop ? 'hand' : { x: parsed.from.x, y: parsed.from.y },
        piece: parsed.piece as PieceType,
        isPromoted: parsed.isPromoted,
        drop: parsed.drop
    };

    return move;

  } catch (error) {
    console.error("AI Error:", error);
    throw error;
  }
};
