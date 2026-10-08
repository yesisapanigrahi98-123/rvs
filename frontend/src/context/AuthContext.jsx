import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sentinelflow_user');
    return saved
      ? JSON.parse(saved)
      : {
          id: 'secops-01',
          name: 'Alex Vance',
          email: 'alex.vance@sentinelflow.ai',
          role: 'SecOps Director',
          clearance: 'LEVEL-4 (TOP SECRET)',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        };
  });

  const [isAuthenticated, setIsAuthenticated] = useState(true);

  useEffect(() => {
    localStorage.setItem('sentinelflow_user', JSON.stringify(user));
  }, [user]);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
