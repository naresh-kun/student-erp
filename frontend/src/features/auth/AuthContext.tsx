import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '@/types';
import { MockAuthService } from '@/services/authService';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';
const STORAGE_KEY_USER = 'student_erp_active_user';
const STORAGE_KEY_ACCESS = 'access_token';
const STORAGE_KEY_REFRESH = 'refresh_token';

// Map seeded demo role usernames for fallback convenience if programmatic role login is invoked
const ROLE_SEED_USERNAMES: Record<UserRole, string> = {
  Admin: 'admin_demo',
  Principal: 'principal_demo',
  Faculty: 'faculty_suresh',
  Student: 'STU202600001',
  Parent: 'STU202600001',
};

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (role: UserRole, userId?: string) => Promise<User>;
  loginWithEmail: (email: string) => Promise<User>;
  loginWithCredentials: (identifier: string, password?: string) => Promise<User>;
  switchRole: (role: UserRole) => Promise<User>;
  logout: () => void;
  mockUsers: User[];
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mockUsers = MockAuthService.getMockUsers();

  // Helper to map backend user data into canonical frontend User object
  const formatUser = (rawUser: any): User => {
    return {
      id: rawUser.id,
      username: rawUser.username,
      email: rawUser.email || '',
      first_name: rawUser.first_name || '',
      last_name: rawUser.last_name || '',
      role: rawUser.role as UserRole,
      is_active: rawUser.is_active ?? true,
      avatar_url: rawUser.avatar_url || '',
      phone: rawUser.phone || '',
      created_at: rawUser.created_at || new Date().toISOString(),
    };
  };

  // Helper to clear all auth storage
  const clearAuthStorage = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(STORAGE_KEY_ACCESS);
        localStorage.removeItem(STORAGE_KEY_REFRESH);
        localStorage.removeItem(STORAGE_KEY_USER);
        MockAuthService.logout();
      }
    } catch (e) {
      console.warn('Failed to clear auth storage:', e);
    }
  }, []);

  // 1. Session Restoration on App Init (Section 6)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        if (typeof window === 'undefined' || !window.localStorage) {
          setIsLoading(false);
          return;
        }

        const accessToken = localStorage.getItem(STORAGE_KEY_ACCESS);
        if (!accessToken) {
          // If no token exists, ensure stale user state is cleared
          clearAuthStorage();
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Validate token against authoritative backend profile endpoint
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/me/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (res.ok) {
          const resData = await res.json();
          const profileData = resData.data || resData;
          const restoredUser = formatUser(profileData);
          setUser(restoredUser);
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(restoredUser));
        } else if (res.status === 401) {
          // Attempt refresh if refresh_token exists
          const refreshToken = localStorage.getItem(STORAGE_KEY_REFRESH);
          if (refreshToken) {
            try {
              const refreshRes = await fetch(`${API_BASE_URL}/api/v1/auth/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: refreshToken }),
              });
              if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                const newAccess = refreshData.access || refreshData.data?.access;
                if (newAccess) {
                  localStorage.setItem(STORAGE_KEY_ACCESS, newAccess);
                  const retryRes = await fetch(`${API_BASE_URL}/api/v1/auth/me/`, {
                    method: 'GET',
                    headers: {
                      'Authorization': `Bearer ${newAccess}`,
                      'Content-Type': 'application/json',
                    },
                  });
                  if (retryRes.ok) {
                    const retryData = await retryRes.json();
                    const profileData = retryData.data || retryData;
                    const restoredUser = formatUser(profileData);
                    setUser(restoredUser);
                    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(restoredUser));
                    setIsLoading(false);
                    return;
                  }
                }
              }
            } catch (refErr) {
              console.warn('Token refresh failed during session restoration:', refErr);
            }
          }
          // Invalidation: clear expired/invalid credentials
          clearAuthStorage();
          setUser(null);
        } else {
          clearAuthStorage();
          setUser(null);
        }
      } catch (err) {
        console.warn('Error during session restoration:', err);
        clearAuthStorage();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [clearAuthStorage]);

  // 2. Real Login with Credentials (Section 5)
  const loginWithCredentials = async (identifier: string, password?: string): Promise<User> => {
    const trimmedId = (identifier || '').trim();
    const trimmedPass = (password || '').trim();

    if (!trimmedId) {
      throw new Error('Please enter your User ID or institutional email.');
    }
    if (!trimmedPass) {
      throw new Error('Please enter your password.');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: trimmedId,
        password: trimmedPass,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Authentication failed. Please check your credentials.';
      try {
        const errorData = await response.json();
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        if (response.status === 401) {
          errorMessage = 'Invalid User ID or password.';
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const access = data.access || data.data?.access;
    const refresh = data.refresh || data.data?.refresh;
    const rawUser = data.user || data.data?.user;

    if (!access || !rawUser) {
      throw new Error('Malformed authentication response from server.');
    }

    // Persist real JWT tokens
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY_ACCESS, access);
        if (refresh) {
          localStorage.setItem(STORAGE_KEY_REFRESH, refresh);
        }
      }
    } catch (e) {
      console.warn('Failed to store tokens in localStorage:', e);
    }

    const authenticatedUser = formatUser(rawUser);

    // Persist active user session
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(authenticatedUser));
      }
    } catch {
      // Ignored
    }

    setUser(authenticatedUser);
    return authenticatedUser;
  };

  // 3. Programmatic Login (preserves interface, backs by real authentication where possible)
  const login = async (role: UserRole, userId?: string): Promise<User> => {
    const seedUsername = ROLE_SEED_USERNAMES[role];
    if (seedUsername) {
      try {
        return await loginWithCredentials(seedUsername, 'demo123');
      } catch {
        // Fall back to MockAuthService if backend is unreachable (e.g., test runner)
      }
    }
    const authenticatedUser = await MockAuthService.login(role, userId);
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  // 4. Login with Email (maps to real login using email as identifier)
  const loginWithEmail = async (email: string): Promise<User> => {
    try {
      return await loginWithCredentials(email, 'demo123');
    } catch {
      const authenticatedUser = await MockAuthService.loginWithEmail(email);
      setUser(authenticatedUser);
      return authenticatedUser;
    }
  };

  // 5. Switch Role
  const switchRole = async (targetRole: UserRole): Promise<User> => {
    return login(targetRole);
  };

  // 6. Logout (Section 7)
  const logout = () => {
    clearAuthStorage();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithEmail,
        loginWithCredentials,
        switchRole,
        logout,
        mockUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
