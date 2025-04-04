import React from 'react';
import { NavLink } from 'react-router-dom';
import { Trophy, Vote } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-black border-b border-[#EA580C] px-8 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-2xl font-bold text-white">
          StudentRank
        </div>
        <div className="flex gap-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-2 text-lg font-medium transition-colors ${
                isActive ? 'text-[#EA580C]' : 'text-white hover:text-[#EA580C]'
              }`
            }
          >
            <Vote size={20} />
            Vote
          </NavLink>
          <NavLink
            to="/leaderboard"
            className={({ isActive }) =>
              `flex items-center gap-2 text-lg font-medium transition-colors ${
                isActive ? 'text-[#EA580C]' : 'text-white hover:text-[#EA580C]'
              }`
            }
          >
            <Trophy size={20} />
            Leaderboard
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;