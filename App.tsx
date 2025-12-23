import React from 'react';
// 1. BrowserRouter ではなく HashRouter をインポート
import { HashRouter, Routes, Route } from 'react-router-dom';
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom';

const App: React.FC = () => {
  return (
    // 2. ここを HashRouter に変更
    <HashRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/game/:roomId" element={<GameRoom />} />
      </Routes>
    </HashRouter>
  );
};

export default App;