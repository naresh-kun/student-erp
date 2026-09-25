/**
 * Student ERP — Mock Authentication Service
 * Simulates user sessions, credentials, and role verification using synthetic Indian school data.
 * All state is persisted to localStorage for consistent user experience.
 */

import type { User, UserRole } from '@/types';
import usersData from '../../../mock-data/users.json';

const STORAGE_KEY = 'student_erp_active_user';

export class MockAuthService {
  // Retrieve list of all available mock user profiles
  static getMockUsers(): User[] {
    return usersData as unknown as User[];
  }

  // Get default mock user profile for a given role
  static getDefaultUserForRole(role: UserRole): User {
    const users = this.getMockUsers();
    const user = users.find((u) => u.role === role);
    if (!user) {
      throw new Error(`No mock user profile found for role: ${role}`);
    }
    return user;
  }

  // Get currently authenticated mock user from localStorage
  static getCurrentUser(): User | null {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored) as User;
        }
      }
    } catch (e) {
      console.warn('Failed to parse active user session:', e);
    }
    return null;
  }

  // Set currently active user session
  static setCurrentUser(user: User | null): void {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        if (user) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // Ignored in non-browser environments
    }
  }

  // Simulated login by role or specific user ID
  static async login(role: UserRole, userId?: string): Promise<User> {
    const users = this.getMockUsers();
    let selectedUser: User | undefined;

    if (userId) {
      selectedUser = users.find((u) => u.id === userId);
    } else {
      selectedUser = users.find((u) => u.role === role);
    }

    if (!selectedUser) {
      throw new Error(`Unable to authenticate: user not found`);
    }

    this.setCurrentUser(selectedUser);
    return selectedUser;
  }

  /**
   * Authenticate user using institutional credentials (User ID / Email + Password).
   * Indian School Authentication Logic:
   * - Student ID (e.g. STU202600001) + Student password -> Authenticates Student
   * - Student ID (e.g. STU202600001) + Parent password ('parent123' / 'demo123-parent') -> Authenticates linked Parent
   * - Staff / Faculty / Admin / Principal email/username + Password -> Authenticates respective role
   */
  static async loginWithCredentials(identifier: string, password?: string): Promise<User> {
    const trimmedId = (identifier || '').trim().toLowerCase();
    const trimmedPass = (password || '').trim();

    if (!trimmedId) {
      throw new Error('Please enter your User ID or institutional email.');
    }

    if (!trimmedPass) {
      throw new Error('Please enter your password.');
    }

    const users = this.getMockUsers();

    // Check if parent is logging in with child's Student ID
    const isParentIntent = 
      trimmedPass === 'parent123' || 
      trimmedPass === 'demo123-parent' || 
      trimmedId.startsWith('p-') || 
      trimmedId.includes('parent') ||
      trimmedId === 'ramanathan@gmail.com' ||
      trimmedId === 'ramanathan.s' ||
      trimmedId === 'selvam@gmail.com' ||
      trimmedId === 'selvam.m';

    if (isParentIntent) {
      let parentUser: User | undefined;

      // Map child's Student ID to the corresponding parent user record
      const upperId = trimmedId.toUpperCase();
      if (upperId === 'STU202600001') {
        parentUser = users.find((u) => u.id === 'usr_007'); // S. Ramanathan
      } else if (upperId === 'STU202600002') {
        parentUser = users.find((u) => u.id === 'usr_008'); // M. Selvam
      } else if (trimmedId === 'selvam@gmail.com' || trimmedId === 'selvam.m') {
        parentUser = users.find((u) => u.id === 'usr_008');
      } else {
        parentUser = users.find((u) => u.role === 'Parent');
      }

      if (parentUser) {
        this.setCurrentUser(parentUser);
        return parentUser;
      }
    }

    // Match against email, username, Student ID, or institutional demonstration aliases
    let user = users.find((u) => {
      const emailMatch = u.email.toLowerCase() === trimmedId;
      const usernameMatch = u.username.toLowerCase() === trimmedId;
      if (emailMatch || usernameMatch) return true;

      // Common institutional aliases for evaluation & demonstration
      if ((trimmedId === 'admin' || trimmedId === 'admin@schoolerp.edu.in' || trimmedId === 'admin@studenterp.edu') && u.role === 'Admin') return true;
      if ((trimmedId === 'principal' || trimmedId === 'principal@schoolerp.edu.in' || trimmedId === 'principal@studenterp.edu') && u.role === 'Principal') return true;
      if ((trimmedId === 'student' || trimmedId === 'student@schoolerp.edu.in' || trimmedId === 'student@studenterp.edu') && u.role === 'Student') return true;
      if ((trimmedId === 'faculty' || trimmedId === 'teacher' || trimmedId === 'faculty@schoolerp.edu.in' || trimmedId === 'faculty@studenterp.edu') && u.role === 'Faculty') return true;
      if ((trimmedId === 'parent' || trimmedId === 'parent@schoolerp.edu.in' || trimmedId === 'parent@studenterp.edu') && u.role === 'Parent') return true;

      return false;
    });

    // If identifier is a known Student ID (e.g. STU202600001)
    if (!user && (trimmedId.includes('stu') || trimmedId === 'stu202600001' || trimmedId === 'stu202600002')) {
      user = users.find((u) => u.role === 'Student');
    }

    if (!user) {
      throw new Error('Invalid User ID or institutional email. Account not found in school directory.');
    }

    if (!user.is_active) {
      throw new Error('This account is deactivated. Please contact the school office administrator.');
    }

    // Check password against synthetic record or accepted demo password
    const validPassword = user.password || 'demo123';
    if (trimmedPass !== validPassword && trimmedPass !== 'demo123' && trimmedPass !== 'password123' && trimmedPass !== 'student123' && trimmedPass !== 'parent123') {
      throw new Error('Invalid password. Please check your credentials.');
    }

    // Role is strictly derived from the matched synthetic mock record
    this.setCurrentUser(user);
    return user;
  }

  // Simulated login via email (legacy support)
  static async loginWithEmail(email: string): Promise<User> {
    const users = this.getMockUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('Invalid email or user not found in school directory');
    }
    this.setCurrentUser(user);
    return user;
  }

  // Terminate session
  static logout(): void {
    this.setCurrentUser(null);
  }
}

export interface SyntheticDemoAccount {
  role: UserRole;
  identifier: string;
  email: string;
  username: string;
  password: string;
  name: string;
  description: string;
}

export const SYNTHETIC_DEMO_ACCOUNTS: SyntheticDemoAccount[] = [
  {
    role: 'Student',
    identifier: 'STU202600001',
    email: 'arun.kumar@schoolerp.edu.in',
    username: 'STU202600001',
    password: 'demo123',
    name: 'Arun Kumar',
    description: 'Enrolled Class 11 Student (Stream: Computer Science A, Sec: A2)',
  },
  {
    role: 'Parent',
    identifier: 'STU202600001',
    email: 'ramanathan@gmail.com',
    username: 'ramanathan.s',
    password: 'parent123',
    name: 'S. Ramanathan',
    description: 'Father / Guardian of Arun Kumar (Logged in via Child Student ID: STU202600001)',
  },
  {
    role: 'Faculty',
    identifier: 'suresh.r@schoolerp.edu.in',
    email: 'suresh.r@schoolerp.edu.in',
    username: 'suresh.r',
    password: 'demo123',
    name: 'R. Suresh',
    description: 'Senior PGT & Department Head (Mathematics), Class Teacher XI-A2',
  },
  {
    role: 'Admin',
    identifier: 'admin@schoolerp.edu.in',
    email: 'admin@schoolerp.edu.in',
    username: 'admin',
    password: 'demo123',
    name: 'K. Narayanan',
    description: 'School Administrative Officer & Office Superintendent',
  },
  {
    role: 'Principal',
    identifier: 'principal@schoolerp.edu.in',
    email: 'principal@schoolerp.edu.in',
    username: 'principal',
    password: 'demo123',
    name: 'Dr. K. Radhakrishnan',
    description: 'Principal & Head of Institution (Executive Leadership)',
  },
];
