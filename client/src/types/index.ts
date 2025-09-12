export type UserRole = "admin" | "instructor" | "student";

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  phoneNumber?: string;
  isActive?: boolean;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  estimatedHours: number;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: number;
  title: string;
  description: string;
  duration: number;
  courseId: number;
  moduleId: number;
  videoUrl?: string;
  content?: string;
  orderIndex: number;
  isActive: boolean;
}