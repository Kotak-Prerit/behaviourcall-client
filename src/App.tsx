import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import LobbyPage from './pages/LobbyPage';
import RoomPage from './pages/RoomPage';
import PredictionPage from './pages/PredictionPage';
import ObservationPage from './pages/ObservationPage';
import RevealPage from './pages/RevealPage';

function App() {
  return (
    <Router>
      <Toaster position="top-center" theme="dark" />
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

