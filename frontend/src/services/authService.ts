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
   *
   * TEMPORARY PHASE 2 DEMO CREDENTIALS:
   * ┌───────────────┬─────────────────┬──────────┐
   * │ Role          │ User ID         │ Password │
   * ├───────────────┼─────────────────┼──────────┤
   * │ Student       │ Student01       │ demo123  │
   * │ Parent        │ Parent01        │ demo123  │
   * │ Faculty       │ Faculty01       │ demo123  │
   * │ Admin         │ Admin           │ demo123  │
   * │ Principal     │ Principal       │ demo123  │
   * └───────────────┴─────────────────┴──────────┘
   *
   * Indian School Authentication Logic:
   * - Student username (e.g. Student01) + password -> Authenticates Student
   * - Parent username (e.g. Parent01) + password -> Authenticates Parent
   *   NOTE: The Student-Parent ID relationship is preserved in the domain model.
   *         The 'Parent01' username is a DEMO ALIAS only — not a Student ID.
   * - Staff / Faculty / Admin / Principal username or email + password -> Authenticates respective role
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

    // Match against email or username (case-insensitive)
    let user = users.find((u) => {
      const emailMatch = u.email.toLowerCase() === trimmedId;
      const usernameMatch = u.username.toLowerCase() === trimmedId;
      if (emailMatch || usernameMatch) return true;

      // ── TEMPORARY PHASE 2 DEMO CREDENTIAL ALIASES ──────────────────────────
      // These short aliases map to the five required demo accounts for presentation.
      // They are NOT the underlying institutional identifiers; see mock-data/users.json.
      if (trimmedId === 'student01' && u.role === 'Student' && u.id === 'usr_005') return true;
      if (trimmedId === 'parent01'  && u.role === 'Parent'  && u.id === 'usr_007') return true;
      if (trimmedId === 'faculty01' && u.role === 'Faculty' && u.id === 'usr_003') return true;
      if (trimmedId === 'admin'     && u.role === 'Admin') return true;
      if (trimmedId === 'principal' && u.role === 'Principal') return true;

      // ── Legacy / Fallback Institutional Aliases ─────────────────────────────
      if ((trimmedId === 'admin@schoolerp.edu.in' || trimmedId === 'admin@studenterp.edu') && u.role === 'Admin') return true;
      if ((trimmedId === 'principal@schoolerp.edu.in' || trimmedId === 'principal@studenterp.edu') && u.role === 'Principal') return true;
      if ((trimmedId === 'student' || trimmedId === 'student@schoolerp.edu.in' || trimmedId === 'student@studenterp.edu') && u.role === 'Student') return true;
      if ((trimmedId === 'faculty' || trimmedId === 'teacher' || trimmedId === 'faculty@schoolerp.edu.in' || trimmedId === 'faculty@studenterp.edu') && u.role === 'Faculty') return true;
      if ((trimmedId === 'parent' || trimmedId === 'parent@schoolerp.edu.in' || trimmedId === 'parent@studenterp.edu') && u.role === 'Parent') return true;

      // Legacy Student ID format support (STU202600001, STU202600002)
      if ((trimmedId === 'stu202600001') && u.id === 'usr_005') return true;
      if ((trimmedId === 'stu202600002') && u.id === 'usr_006') return true;

      return false;
    });

    if (!user) {
      throw new Error('Invalid User ID or institutional email. Account not found in school directory.');
    }

    if (!user.is_active) {
      throw new Error('This account is deactivated. Please contact the school office administrator.');
    }

    // Password verification: accept stored password or universal demo fallback
    const validPassword = user.password || 'demo123';
    if (trimmedPass !== validPassword && trimmedPass !== 'demo123') {
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

/**
 * TEMPORARY PHASE 2 DEMO CREDENTIALS
 * For presentation / demonstration purposes only.
 * These will be replaced by real authentication in Phase 4.
 */
export const SYNTHETIC_DEMO_ACCOUNTS: SyntheticDemoAccount[] = [
  {
    role: 'Student',
    identifier: 'Student01',
    email: 'arun.kumar@schoolerp.edu.in',
    username: 'Student01',
    password: 'demo123',
    name: 'Arun Kumar',
    description: 'Enrolled Class 11 Student (Stream: Computer Science A, Sec: A2)',
  },
  {
    role: 'Parent',
    identifier: 'Parent01',
    email: 'ramanathan@gmail.com',
    username: 'Parent01',
    password: 'demo123',
    name: 'S. Ramanathan',
    // NOTE: The Student-Parent relationship (Parent linked to STU202600001) is preserved
    // in the domain model. 'Parent01' is a demo login alias only.
    description: 'Father / Guardian of Arun Kumar (STU202600001) — Phase 2 Demo Alias',
  },
  {
    role: 'Faculty',
    identifier: 'Faculty01',
    email: 'suresh.r@schoolerp.edu.in',
    username: 'Faculty01',
    password: 'demo123',
    name: 'R. Suresh',
    description: 'Senior PGT & Department Head (Mathematics), Class Teacher XI-A2',
  },
  {
    role: 'Admin',
    identifier: 'Admin',
    email: 'admin@schoolerp.edu.in',
    username: 'Admin',
    password: 'demo123',
    name: 'K. Narayanan',
    description: 'School Administrative Officer & Office Superintendent',
  },
  {
    role: 'Principal',
    identifier: 'Principal',
    email: 'principal@schoolerp.edu.in',
    username: 'Principal',
    password: 'demo123',
    name: 'Dr. K. Radhakrishnan',
    description: 'Principal & Head of Institution (Executive Leadership)',
  },
];
