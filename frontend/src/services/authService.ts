/**
 * Student ERP — Mock Authentication Service
 * Simulates user sessions, credentials, and role switching using synthetic mock data.
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
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as User;
      }
    } catch (e) {
      console.warn('Failed to parse active user session:', e);
    }
    return null;
  }

  // Set currently active user session
  static setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
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

  // Authenticate user using institutional credentials (User ID / Email + Password)
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
    // Match against email, username, or institutional demonstration aliases
    const user = users.find((u) => {
      const emailMatch = u.email.toLowerCase() === trimmedId;
      const usernameMatch = u.username.toLowerCase() === trimmedId;
      if (emailMatch || usernameMatch) return true;

      // Common institutional aliases for evaluation & demonstration
      if ((trimmedId === 'admin' || trimmedId === 'admin@studenterp.edu') && u.role === 'Admin') return true;
      if ((trimmedId === 'principal' || trimmedId === 'principal@studenterp.edu') && u.role === 'Principal') return true;
      if ((trimmedId === 'student' || trimmedId === 'student@studenterp.edu') && u.role === 'Student') return true;
      if ((trimmedId === 'faculty' || trimmedId === 'faculty@studenterp.edu' || trimmedId === 'teacher') && u.role === 'Faculty') return true;
      if ((trimmedId === 'parent' || trimmedId === 'parent@studenterp.edu' || trimmedId === 'robert.morgan@studenterp.edu') && u.role === 'Parent') return true;

      return false;
    });

    if (!user) {
      throw new Error('Invalid User ID or institutional email. Account not found in institutional directory.');
    }

    if (!user.is_active) {
      throw new Error('This account is deactivated. Please contact your ERP administrator.');
    }

    // Check password against synthetic record or accepted demo password
    const validPassword = user.password || 'demo123';
    if (trimmedPass !== validPassword && trimmedPass !== 'demo123' && trimmedPass !== 'password123') {
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
      throw new Error('Invalid email or user not found in mock directory');
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
    identifier: 'alex.morgan@studenterp.edu',
    email: 'alex.morgan@studenterp.edu',
    username: 'alex.morgan',
    password: 'demo123',
    name: 'Alex Morgan',
    description: 'Enrolled Grade 11 Student (Roll #STU-11A-001)',
  },
  {
    role: 'Parent',
    identifier: 'robert.morgan@gmail.com',
    email: 'robert.morgan@gmail.com',
    username: 'robert.morgan',
    password: 'demo123',
    name: 'Robert Morgan',
    description: 'Guardian of Alex Morgan (stu_001)',
  },
  {
    role: 'Faculty',
    identifier: 'sarah.jenkins@studenterp.edu',
    email: 'sarah.jenkins@studenterp.edu',
    username: 'sarah.jenkins',
    password: 'demo123',
    name: 'Sarah Jenkins',
    description: 'Senior Mathematics Faculty & Section 11-A Coordinator',
  },
  {
    role: 'Admin',
    identifier: 'admin@studenterp.edu',
    email: 'admin@studenterp.edu',
    username: 'superadmin',
    password: 'demo123',
    name: 'Eleanor Vance',
    description: 'System Administrator & Master Registrar',
  },
  {
    role: 'Principal',
    identifier: 'principal.sharma@studenterp.edu',
    email: 'principal.sharma@studenterp.edu',
    username: 'principal.sharma',
    password: 'demo123',
    name: 'Arthur Sharma',
    description: 'Head of Institution / Executive Leadership',
  },
];
