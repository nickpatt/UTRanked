import React from 'react';
import { Trophy } from 'lucide-react';
import { Student } from '../types';

// Using the same mock data
const mockStudents: Student[] = [
  {
    id: 1,
    name: "Alex Thompson",
    imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
    experience: ["Software Engineer Intern at Google", "Research Assistant at University Lab"],
    education: ["BS Computer Science, Stanford University"],
    elo: 1500
  },
  {
    id: 2,
    name: "Sarah Chen",
    imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400",
    experience: ["Product Manager Intern at Microsoft", "Teaching Assistant"],
    education: ["MS Data Science, MIT"],
    elo: 1450
  }
];

function LeaderboardPage() {
  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Trophy size={32} className="text-[#EA580C]" />
          <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
        </div>
        
        <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-800">
          {mockStudents
            .sort((a, b) => b.elo - a.elo)
            .map((student, index) => (
              <div 
                key={student.id}
                className="flex items-center justify-between p-4 border-b border-gray-800 last:border-b-0 hover:bg-gray-800/50"
              >
                <div className="flex items-center gap-4">
                  <span className="font-bold text-[#EA580C] w-8">{index + 1}</span>
                  <img 
                    src={student.imageUrl} 
                    alt={student.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#EA580C]"
                  />
                  <div>
                    <h3 className="font-semibold text-white">{student.name}</h3>
                    <p className="text-sm text-gray-400">{student.education[0]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[#EA580C]">
                  <Trophy size={16} />
                  <span className="font-bold">{student.elo}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default LeaderboardPage;