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

  // Simulated login via email/password
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
