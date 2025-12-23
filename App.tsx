import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* URLが / ならロビーを表示 */}
        <Route path="/" element={<Lobby />} />
        
        {/* URLが /game/xxxxx なら対局部屋を表示 */}
        <Route path="/game/:roomId" element={<GameRoom />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;