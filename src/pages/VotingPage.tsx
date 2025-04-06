import React, { useState, useEffect } from 'react';
import { Trophy, Briefcase, GraduationCap, ChevronRight, Equal, ArrowRight, GraduationCap as CategoryIcon } from 'lucide-react';
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

function VotingPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category>("Computer Science");
  const [students, setStudents] = useState<Student[]>([]);
  const [leftStudent, setLeftStudent] = useState<Student | null>(null);
  const [rightStudent, setRightStudent] = useState<Student | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showNext, setShowNext] = useState(false);

  useEffect(() => {
    const filteredStudents = mockStudents.filter(student => student.category === selectedCategory);
    setStudents(filteredStudents);
    
    // Reset the comparison when category changes
    if (filteredStudents.length >= 2) {
      setLeftStudent(filteredStudents[0]);
      setRightStudent(filteredStudents[1]);
      setSelectedId(null);
      setShowNext(false);
    }
  }, [selectedCategory]);

  const handleComparison = (winnerId: number) => {
    if (selectedId !== null) return;
    setSelectedId(winnerId);
    setShowNext(true);

    setStudents(prevStudents => {
      return prevStudents.map(student => {
        if (student.id === winnerId) {
          return { ...student, elo: student.elo + 32 };
        } else {
          return { ...student, elo: student.elo - 32 };
        }
      });
    });
  };

  const handleEqual = () => {
    if (selectedId !== null) return;
    setSelectedId(-1);
    setShowNext(true);
  };

  const handleNext = () => {
    if (!students.length) return;
    
    setSelectedId(null);
    setShowNext(false);
    
    // Get two random different students from the current category
    let newLeft, newRight;
    do {
      newLeft = students[Math.floor(Math.random() * students.length)];
      newRight = students[Math.floor(Math.random() * students.length)];
    } while (newLeft.id === newRight.id);
    
    setLeftStudent(newLeft);
    setRightStudent(newRight);
  };

  const StudentCard = ({ student, onClick, isSelected }: { student: Student; onClick: () => void; isSelected: boolean }) => (
    <div 
      onClick={onClick}
      className={`bg-gray-900 rounded-xl shadow-lg p-6 w-[400px] h-[600px] cursor-pointer transform transition-all duration-300 
        ${selectedId === null ? 'hover:scale-105' : ''} 
        ${isSelected ? 'ring-2 ring-[#EA580C]' : ''} 
        ${selectedId !== null && !isSelected ? 'opacity-50' : ''}
        border border-gray-800`}
    >
      <div className="flex flex-col items-center space-y-4 h-full">
        <div className="relative">
          <img 
            src={student.imageUrl} 
            alt={student.name}
            className={`w-32 h-32 rounded-full object-cover border-4 border-[#EA580C] ${selectedId === null ? 'blur-md' : ''}`}
          />
          <div className="absolute -top-2 -right-2 bg-[#EA580C] text-white px-2 py-1 rounded-full text-sm font-bold">
            {student.elo}
          </div>
        </div>
        <h2 className={`text-2xl font-bold text-white transition-opacity duration-300 ${selectedId === null ? 'opacity-0' : 'opacity-100'}`}>
          {student.name}
        </h2>
        
        <div className="w-full space-y-4 flex-grow">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#EA580C]">
              <Briefcase size={20} />
              <h3 className="font-semibold">Experience</h3>
            </div>
            <ul className="text-sm text-gray-400 space-y-1">
              {student.experience.map((exp, i) => (
                <li key={i} className="flex items-center gap-2">
                  <ChevronRight size={16} className="text-[#EA580C]" />
                  {exp}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#EA580C]">
              <GraduationCap size={20} />
              <h3 className="font-semibold">Education</h3>
            </div>
            <ul className="text-sm text-gray-400 space-y-1">
              {student.education.map((edu, i) => (
                <li key={i} className="flex items-center gap-2">
                  <ChevronRight size={16} className="text-[#EA580C]" />
                  {edu}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 text-[#EA580C] mt-4">
            <Trophy size={20} />
            <span className="font-semibold">ELO Rating</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 relative min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-4xl font-bold text-center mb-4 text-white">Rank students at UT</h1>
          
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
        
        {students.length >= 2 ? (
          <div className="flex justify-center items-center gap-8">
            {leftStudent && (
              <StudentCard 
                student={leftStudent} 
                onClick={() => handleComparison(leftStudent.id)} 
                isSelected={selectedId === leftStudent.id}
              />
            )}
            <div className="flex flex-col items-center gap-6">
              <button 
                onClick={handleEqual}
                className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300
                  ${selectedId === -1 
                    ? 'border-[#EA580C] bg-[#EA580C]/10 text-[#EA580C]' 
                    : 'border-gray-500 text-gray-500 hover:border-[#EA580C] hover:text-[#EA580C]'}`}
              >
                <Equal size={32} />
              </button>
              <div className="text-4xl font-bold text-[#EA580C]">VS</div>
            </div>
            {rightStudent && (
              <StudentCard 
                student={rightStudent} 
                onClick={() => handleComparison(rightStudent.id)} 
                isSelected={selectedId === rightStudent.id}
              />
            )}
          </div>
        ) : (
          <div className="text-center text-white text-xl">
            Not enough students in this category for comparison.
          </div>
        )}

        {showNext && (
          <div className="absolute bottom-8 right-8">
            <button
              onClick={handleNext}
              className="bg-[#EA580C] text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-[#EA580C]/90 transition-colors"
            >
              Next Comparison
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default VotingPage;