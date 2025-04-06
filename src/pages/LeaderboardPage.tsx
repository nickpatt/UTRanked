import React, { useState, useEffect } from 'react';
import { Trophy, GraduationCap as CategoryIcon } from 'lucide-react';
import { Student, Category } from '../types';

const categories: Category[] = [
  "Computer Science",
  "Business",
  "Engineering",
  "Architecture",
  "Communication",
  "Education",
  "Fine Arts",
  "Geosciences",
  "Liberal Arts",
  "Natural Sciences",
  "Nursing",
  "Pharmacy",
  "Public Affairs",
  "Social Work"
];

// Using the same mock data from VotingPage
const mockStudents: Student[] = [
  {
    id: 1,
    name: "Alex Thompson",
    imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
    experience: ["Software Engineer Intern at Google", "Research Assistant at University Lab"],
    education: ["BS Computer Science, Stanford University"],
    elo: 1500,
    category: "Computer Science"
  },
  {
    id: 2,
    name: "Sarah Chen",
    imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400",
    experience: ["Product Manager Intern at Microsoft", "Teaching Assistant"],
    education: ["MS Data Science, MIT"],
    elo: 1450,
    category: "Computer Science"
  },
  {
    id: 3,
    name: "Michael Rodriguez",
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
    experience: ["Investment Banking Intern at Goldman Sachs", "Finance Club President"],
    education: ["BBA Finance, UT Austin"],
    elo: 1480,
    category: "Business"
  },
  {
    id: 4,
    name: "Emily Zhang",
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400",
    experience: ["Civil Engineering Intern at AECOM", "Research Assistant"],
    education: ["BS Civil Engineering, UT Austin"],
    elo: 1520,
    category: "Engineering"
  }
];

function LeaderboardPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("Computer Science");
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

  useEffect(() => {
    const students = mockStudents
      .filter(student => student.category === selectedCategory)
      .sort((a, b) => b.elo - a.elo);
    setFilteredStudents(students);
  }, [selectedCategory]);

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="flex items-center justify-center gap-3">
            <Trophy size={32} className="text-[#EA580C]" />
            <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
          </div>

          <div className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg border border-gray-800">
            <CategoryIcon size={20} className="text-[#EA580C]" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as Category)}
              className="bg-transparent text-white border-none outline-none focus:ring-0 cursor-pointer"
            >
              {categories.map(category => (
                <option key={category} value={category} className="bg-gray-900">
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-800">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student, index) => (
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
            ))
          ) : (
            <div className="text-center text-gray-400 py-8">
              No students found in this category
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LeaderboardPage;