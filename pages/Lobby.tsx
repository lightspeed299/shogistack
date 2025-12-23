import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Lobby: React.FC = () => {
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [isAnalysis, setIsAnalysis] = useState(false); // ★追加
  const navigate = useNavigate();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim() && userName.trim()) {
      // ★ URLに mode=analysis を追加
      const modeParam = isAnalysis ? '&mode=analysis' : '';
      navigate(`/game/${roomId}?name=${userName}${modeParam}`);
    }
  };

  const createRandomRoom = () => {
     const randomId = Math.random().toString(36).substring(2, 8);
     setRoomId(randomId);
  };

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4 relative">
      <form onSubmit={handleJoin} className="bg-stone-800 p-8 rounded-lg shadow-xl border border-amber-700/30 max-w-sm w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-amber-100 font-serif mb-2">ShogiStack</h1>
          <p className="text-stone-500 text-sm">シンプルで高機能なWeb将棋盤</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-stone-400 text-sm mb-1">ユーザー名</label>
            <input 
              type="text" 
              value={userName} 
              onChange={(e) => setUserName(e.target.value)} 
              className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-3 text-white focus:border-amber-500 focus:outline-none transition-colors"
              placeholder="あなたの名前"
              required 
            />
          </div>
          
          <div>
            <label className="block text-stone-400 text-sm mb-1">ルームID</label>
            <div className="flex gap-2">
                <input 
                type="text" 
                value={roomId} 
                onChange={(e) => setRoomId(e.target.value)} 
                className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-3 text-white focus:border-amber-500 focus:outline-none transition-colors font-mono"
                placeholder="部屋の名前"
                required 
                />
                <button type="button" onClick={createRandomRoom} className="bg-stone-700 text-stone-300 px-3 rounded hover:bg-stone-600 text-xs whitespace-nowrap">
                    自動生成
                </button>
            </div>
          </div>

          {/* ★追加: 検討室モードチェックボックス */}
          <div className="flex items-center gap-3 p-3 bg-stone-900/50 rounded border border-stone-700">
             <input 
               type="checkbox" 
               id="analysisMode" 
               checked={isAnalysis} 
               onChange={(e) => setIsAnalysis(e.target.checked)} 
               className="w-5 h-5 accent-amber-600 cursor-pointer" 
             />
             <label htmlFor="analysisMode" className="text-stone-300 text-sm cursor-pointer select-none">検討室モード（一人用）</label>
          </div>
        </div>

        <button type="submit" className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-3 rounded shadow-lg transform active:scale-95 transition-all">
          入室する
        </button>
      </form>
    </div>
  );
};

export default Lobby;