import React, { useState, useEffect, useRef } from 'react';

// メッセージ型定義に userName を追加
interface ChatProps {
  messages: { id: string, text: string, role: string, userName?: string, timestamp: number }[]; 
  onSendMessage: (text: string) => void;
  myRole: string;
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, myRole }) => {
  const [input, setInput] = useState("");
  // ★変更: コンテナ全体のrefに変更
  const containerRef = useRef<HTMLDivElement>(null);

  // ★変更: scrollIntoView をやめ、scrollTop を操作する方式に変更
  // これにより、画面全体がガクッと動くのを防ぎます
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput("");
    }
  };

  const getRoleLabel = (r: string) => {
      if (r === 'sente') return '先手';
      if (r === 'gote') return '後手';
      return '観戦';
  };
  
  return (
    <div className="flex flex-col h-full bg-stone-900 border border-stone-700 rounded-lg overflow-hidden">
      <div className="bg-stone-800 p-2 border-b border-stone-700 text-stone-300 text-sm font-bold">
        チャット
      </div>
      
      {/* ★変更: refをここに設定 */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map((msg) => {
            const isMe = msg.role === myRole;
            const isSystem = msg.role === 'system';

            if (isSystem) {
                return (
                    <div key={msg.id} className="text-center text-xs text-stone-500 py-1 opacity-70">
                        -- {msg.text} --
                    </div>
                );
            }

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {/* ★変更: roleだけでなく、userNameを表示 */}
                <div className={`text-[10px] mb-0.5 flex gap-1 ${isMe ? 'text-stone-400' : 'text-stone-500'}`}>
                   <span className="font-bold">{msg.userName || "不明"}</span>
                   <span>({getRoleLabel(msg.role)})</span>
                </div>
                
                <div className={`px-3 py-2 rounded max-w-[90%] text-sm break-words shadow-sm ${
                    msg.role === 'sente' ? 'bg-amber-100 text-stone-900 border border-amber-200' :
                    msg.role === 'gote' ? 'bg-stone-700 text-stone-100 border border-stone-600' :
                    'bg-stone-800 text-stone-300 border border-stone-700'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
        })}
      </div>

      <form onSubmit={handleSubmit} className="p-2 bg-stone-800 border-t border-stone-700 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-stone-900 border border-stone-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-amber-600"
          placeholder="メッセージ..."
        />
        <button type="submit" className="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded text-sm font-bold">送信</button>
      </form>
    </div>
  );
};

export default Chat;