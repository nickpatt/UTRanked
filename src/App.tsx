import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import VotingPage from './pages/VotingPage';
import LeaderboardPage from './pages/LeaderboardPage.tsx';

function App() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <Routes>
        <Route path="/" element={<VotingPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Routes>
    </div>
  );
}

export default App;