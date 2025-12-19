// components/Chat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Player } from '../types';

interface ChatMessage {
  id: string;
  text: string;
  role: 'sente' | 'gote' | 'audience';
  timestamp: number;
}

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  myRole: 'sente' | 'gote' | 'audience';
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, myRole }) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 新しいメッセージが来たら自動スクロール
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'sente': return '☗ 先手';
      case 'gote': return '☖ 後手';
      default: return '観戦';
    }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'sente': return 'text-stone-300'; // 黒っぽい色（ダークモードなので明るいグレー）
      case 'gote': return 'text-stone-300';
      default: return 'text-green-400';
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 border border-stone-700 rounded-lg overflow-hidden shadow-lg w-full max-w-sm">
      {/* ヘッダー */}
      <div className="bg-stone-800 p-2 border-b border-stone-700 font-bold text-stone-400 text-sm text-center">
        チャット
      </div>

      {/* メッセージログ */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-stone-900/50">
        {messages.length === 0 && (
           <div className="text-center text-stone-600 text-xs mt-4">まだメッセージはありません</div>
        )}
        {messages.map((msg) => {
          const isMe = msg.role === myRole;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`text-[10px] font-bold ${getRoleColor(msg.role)}`}>
                  {getRoleLabel(msg.role)}
                </span>
              </div>
              <div className={`
                max-w-[85%] px-3 py-2 rounded-lg text-sm break-words
                ${isMe 
                  ? 'bg-amber-800/60 text-amber-50 border border-amber-700/50 rounded-tr-none' 
                  : 'bg-stone-800 text-stone-300 border border-stone-700 rounded-tl-none'}
              `}>
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} className="p-2 bg-stone-800 border-t border-stone-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力..."
          className="flex-1 bg-stone-900 border border-stone-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-600"
        />
        <button 
          type="submit" 
          disabled={!input.trim()}
          className="bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-1 rounded text-sm font-bold transition-colors"
        >
          送信
        </button>
      </form>
    </div>
  );
};

export default Chat;