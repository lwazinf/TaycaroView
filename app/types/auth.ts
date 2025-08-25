export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  institution: string;
  department: string;
  createdAt: Date;
  lastLogin: Date;
  isActive: boolean;
  profileImage: string;
}

export type UserRole = 'instructor' | 'admin' | 'student' | 'coordinator';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  // Updated register function signature to match your implementation
  register: (
    email: string,
    password: string,
    confirmPassword: string,
    displayName: string,
    role: UserRole,
    institution?: string,
    department?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  role: UserRole;
  institution?: string;
  department?: string;
} 