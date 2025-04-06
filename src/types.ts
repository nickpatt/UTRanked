export interface Student {
  id: number;
  name: string;
  imageUrl: string;
  experience: string[];
  education: string[];
  elo: number;
  category: string;
}

export type Category = 
  | "Computer Science"
  | "Business"
  | "Engineering"
  | "Architecture"
  | "Communication"
  | "Education"
  | "Fine Arts"
  | "Geosciences"
  | "Liberal Arts"
  | "Natural Sciences"
  | "Nursing"
  | "Pharmacy"
  | "Public Affairs"
  | "Social Work";