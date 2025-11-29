import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LobbyPage from './pages/LobbyPage';
import RoomPage from './pages/RoomPage';
import PredictionPage from './pages/PredictionPage';
import ObservationPage from './pages/ObservationPage';
import RevealPage from './pages/RevealPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LobbyPage />} />
        <Route path="/room/:code" element={<RoomPage />} />
        <Route path="/prediction/:roundId" element={<PredictionPage />} />
        <Route path="/observation/:roundId" element={<ObservationPage />} />
        <Route path="/reveal/:roundId" element={<RevealPage />} />
      </Routes>
    </Router>
  );
}

export default App;

