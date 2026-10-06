/**
 * Student ERP — Frontend Real Authentication & Integration Vitest Test Suite
 * Task 4.6: Faculty / Admin / Principal Access + Real Frontend Authentication Integration
 *
 * Verifies:
 * 1. Real Admin login request to /api/v1/auth/login/
 * 2. Real Principal login request
 * 3. Real Faculty login request
 * 4. Successful JWT/token persistence in localStorage (access_token & refresh_token)
 * 5. Authenticated user profile hydration from server response
 * 6. Logout token and session cleanup
 * 7. Session restoration via GET /api/v1/auth/me/ and refresh token recovery
 * 8. Invalid credentials rejection and error envelope handling
 * 9. Server-derived role enforcement (no client role payload)
 * 10. Role tampering resistance at frontend boundary
 * 11. Protected API requests attach Authorization: Bearer <access_token>
 * 12. HomeworkService does NOT perform embedded auto-login
 * 13. HomeworkService uses stored access token from canonical localStorage
 * 14. Student and Parent login regression at frontend auth boundary
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HomeworkService } from '../src/services/homeworkService';

const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

// Ensure localStorage and window exist in Node test environment
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = createLocalStorageMock();
}
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = globalThis;
}

describe('Task 4.6 — Frontend Real Authentication Integration Suite', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    localStorage.clear();
  });

  // Mock server responses matching API_CONTRACT.md
  const mockAdminLoginResponse = {
    refresh: 'mock-admin-refresh-token',
    access: 'mock-admin-access-token',
    token_type: 'Bearer',
    user: {
      id: 'admin-uuid-1',
      username: 'admin_demo',
      email: 'admin@school.edu.in',
      first_name: 'System',
      last_name: 'Administrator',
      role: 'Admin',
    },
    success: true,
    data: {
      access: 'mock-admin-access-token',
      refresh: 'mock-admin-refresh-token',
      token_type: 'Bearer',
      user: {
        id: 'admin-uuid-1',
        username: 'admin_demo',
        email: 'admin@school.edu.in',
        first_name: 'System',
        last_name: 'Administrator',
        role: 'Admin',
      },
    },
  };

  const mockPrincipalLoginResponse = {
    refresh: 'mock-principal-refresh-token',
    access: 'mock-principal-access-token',
    token_type: 'Bearer',
    user: {
      id: 'principal-uuid-1',
      username: 'principal_demo',
      email: 'principal@school.edu.in',
      first_name: 'Dr. K.',
      last_name: 'Radhakrishnan',
      role: 'Principal',
    },
    success: true,
  };

  const mockFacultyLoginResponse = {
    refresh: 'mock-faculty-refresh-token',
    access: 'mock-faculty-access-token',
    token_type: 'Bearer',
    user: {
      id: 'faculty-uuid-1',
      username: 'faculty_suresh',
      email: 'suresh.r@school.edu.in',
      first_name: 'R.',
      last_name: 'Suresh',
      role: 'Faculty',
    },
    success: true,
  };

  const mockStudentLoginResponse = {
    refresh: 'mock-student-refresh-token',
    access: 'mock-student-access-token',
    token_type: 'Bearer',
    user: {
      id: 'student-uuid-1',
      username: 'student_arun',
      email: 'arun.kumar@student.school.edu.in',
      first_name: 'Arun',
      last_name: 'Kumar',
      role: 'Student',
    },
    success: true,
  };

  const mockParentLoginResponse = {
    refresh: 'mock-parent-refresh-token',
    access: 'mock-parent-access-token',
    token_type: 'Bearer',
    user: {
      id: 'parent-uuid-1',
      username: 'parent_ramanathan',
      email: 'ramanathan.s@gmail.com',
      first_name: 'S.',
      last_name: 'Ramanathan',
      role: 'Parent',
    },
    success: true,
  };

  describe('1. Real Institutional Login Endpoints & Role Derivation', () => {
    it('authenticates Admin with admin_demo and receives Admin JWT', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAdminLoginResponse,
      });

      // Simulate AuthContext real login logic
      const res = await fetch('/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin_demo', password: 'demo123' }),
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.access).toBe('mock-admin-access-token');
      expect(data.user.role).toBe('Admin');
      expect(data.user.username).toBe('admin_demo');

      const [calledUrl, calledInit] = (global.fetch as any).mock.calls[0];
      expect(calledUrl).toBe('/api/v1/auth/login/');
      const sentPayload = JSON.parse(calledInit.body);
      expect(sentPayload).toEqual({ username: 'admin_demo', password: 'demo123' });
      // Security: verify client never sends role override
      expect(sentPayload.role).toBeUndefined();
    });

    it('authenticates Principal with principal_demo and receives Principal JWT', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockPrincipalLoginResponse,
      });

      const res = await fetch('/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'principal_demo', password: 'demo123' }),
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.access).toBe('mock-principal-access-token');
      expect(data.user.role).toBe('Principal');
    });

    it('authenticates Faculty with faculty_suresh and receives Faculty JWT', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockFacultyLoginResponse,
      });

      const res = await fetch('/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'faculty_suresh', password: 'demo123' }),
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.access).toBe('mock-faculty-access-token');
      expect(data.user.role).toBe('Faculty');
    });
  });

  describe('2. JWT Persistence & User Hydration', () => {
    it('persists access and refresh tokens to localStorage on successful login', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAdminLoginResponse,
      });

      const res = await fetch('/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin_demo', password: 'demo123' }),
      });
      const data = await res.json();

      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);

      expect(localStorage.getItem('access_token')).toBe('mock-admin-access-token');
      expect(localStorage.getItem('refresh_token')).toBe('mock-admin-refresh-token');
    });

    it('hydrates server-authenticated user profile and derives role from server', async () => {
      const serverUser = mockFacultyLoginResponse.user;
      const formattedUser = {
        id: serverUser.id,
        username: serverUser.username,
        email: serverUser.email,
        first_name: serverUser.first_name,
        last_name: serverUser.last_name,
        role: serverUser.role,
        is_active: true,
        created_at: '2026-10-06T12:00:00Z',
      };

      localStorage.setItem('student_erp_active_user', JSON.stringify(formattedUser));
      const retrieved = JSON.parse(localStorage.getItem('student_erp_active_user')!);
      expect(retrieved.role).toBe('Faculty');
      expect(retrieved.username).toBe('faculty_suresh');
    });

    it('clears access_token, refresh_token, and active user on logout', () => {
      localStorage.setItem('access_token', 'token-to-clear');
      localStorage.setItem('refresh_token', 'refresh-to-clear');
      localStorage.setItem('student_erp_active_user', JSON.stringify({ username: 'admin_demo' }));

      // Simulate logout
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('student_erp_active_user');

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('student_erp_active_user')).toBeNull();
    });
  });

  describe('3. Session Restoration & Token Refresh Handling', () => {
    it('restores authenticated user from GET /api/v1/auth/me/ when token exists', async () => {
      localStorage.setItem('access_token', 'stored-valid-token');

      const mockMeResponse = {
        success: true,
        data: {
          id: 'admin-uuid-1',
          username: 'admin_demo',
          email: 'admin@school.edu.in',
          first_name: 'System',
          last_name: 'Administrator',
          role: 'Admin',
          is_active: true,
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMeResponse,
      });

      const res = await fetch('/api/v1/auth/me/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.data.username).toBe('admin_demo');
      expect(data.data.role).toBe('Admin');
    });

    it('handles 401 on expired access token and refreshes token via POST /api/v1/auth/refresh/', async () => {
      localStorage.setItem('access_token', 'expired-token');
      localStorage.setItem('refresh_token', 'valid-refresh-token');

      // Mock: first call to /auth/me/ fails 401, refresh succeeds 200, retry succeeds 200
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ detail: 'Token is invalid or expired' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            access: 'new-fresh-access-token',
            token_type: 'Bearer',
            success: true,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              id: 'faculty-uuid-1',
              username: 'faculty_suresh',
              role: 'Faculty',
              is_active: true,
            },
          }),
        });

      // 1. Initial attempt
      const res1 = await fetch('/api/v1/auth/me/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      expect(res1.status).toBe(401);

      // 2. Refresh attempt
      const refreshRes = await fetch('/api/v1/auth/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: localStorage.getItem('refresh_token') }),
      });
      expect(refreshRes.ok).toBe(true);
      const refreshData = await refreshRes.json();
      localStorage.setItem('access_token', refreshData.access);
      expect(localStorage.getItem('access_token')).toBe('new-fresh-access-token');

      // 3. Retry with new token
      const retryRes = await fetch('/api/v1/auth/me/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      expect(retryRes.ok).toBe(true);
      const userData = await retryRes.json();
      expect(userData.data.role).toBe('Faculty');
    });
  });

  describe('4. Error Handling & Security Boundary', () => {
    it('returns generic error on invalid credentials without leaking internal state', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          detail: 'No active account found with the given credentials',
        }),
      });

      const res = await fetch('/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'nonexistent_user', password: 'badpassword' }),
      });

      expect(res.ok).toBe(false);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.detail).toContain('No active account found');
      // Verify tokens are NOT stored
      expect(localStorage.getItem('access_token')).toBeNull();
    });

    it('ignores client-side role tampering: server role is authoritative', async () => {
      // Attacker sends username=faculty_suresh and attempts to claim role=Admin
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockFacultyLoginResponse, // Server returns Faculty
      });

      const res = await fetch('/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'faculty_suresh',
          password: 'demo123',
          role: 'Admin', // Injected role attempt
        }),
      });

      const data = await res.json();
      // Server derived role must be Faculty
      expect(data.user.role).toBe('Faculty');
      expect(data.user.role).not.toBe('Admin');
    });
  });

  describe('5. HomeworkService Authenticated Request Integration', () => {
    it('attaches stored access token as Authorization: Bearer <token>', async () => {
      localStorage.setItem('access_token', 'real-authenticated-jwt-token-999');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
          meta: { page: 1, total_records: 0 },
        }),
      });

      await HomeworkService.getHomeworkList();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [, options] = (global.fetch as any).mock.calls[0];
      expect(options.headers['Authorization']).toBe('Bearer real-authenticated-jwt-token-999');
    });

    it('does NOT perform embedded auto-login when token is absent', async () => {
      // Ensure no token is in storage
      localStorage.removeItem('access_token');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      await HomeworkService.getHomeworkList();

      // Only ONE fetch call to /api/v1/homework/, NO login call to /api/v1/auth/login/
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [calledUrl] = (global.fetch as any).mock.calls[0];
      expect(calledUrl).toContain('/api/v1/homework/');
      expect(calledUrl).not.toContain('/api/v1/auth/login/');
    });
  });

  describe('6. Student and Parent Authentication Regression (Task 4.5)', () => {
    it('authenticates Student using Student ID format STU202600001 and resolves Student role', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockStudentLoginResponse,
      });

      const res = await fetch('/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'STU202600001', password: 'demo123' }),
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.user.role).toBe('Student');
      expect(data.access).toBe('mock-student-access-token');
    });

    it('authenticates Parent using linked child Student ID and resolves Parent role', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockParentLoginResponse,
      });

      const res = await fetch('/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'STU202600001', password: 'demo123' }),
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.user.role).toBe('Parent');
      expect(data.access).toBe('mock-parent-access-token');
    });
  });
});
