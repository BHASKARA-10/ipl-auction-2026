import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import AuctionRoom from './pages/AuctionRoom';
import { useEffect } from 'react';
import { socket } from './socket';

function App() {
  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/room/:roomId/lobby" element={<Lobby />} />
          <Route path="/room/:roomId/auction" element={<AuctionRoom />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
