import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '@/types';
import { MockAuthService } from '@/services/authService';

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

  useEffect(() => {
    // Restore user session from localStorage
    const savedUser = MockAuthService.getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (role: UserRole, userId?: string): Promise<User> => {
    const authenticatedUser = await MockAuthService.login(role, userId);
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const loginWithEmail = async (email: string): Promise<User> => {
    const authenticatedUser = await MockAuthService.loginWithEmail(email);
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const loginWithCredentials = async (identifier: string, password?: string): Promise<User> => {
    const authenticatedUser = await MockAuthService.loginWithCredentials(identifier, password);
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const switchRole = async (targetRole: UserRole): Promise<User> => {
    const newUser = await MockAuthService.login(targetRole);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    MockAuthService.logout();
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
