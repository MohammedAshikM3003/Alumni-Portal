import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from cookies on mount
  useEffect(() => {
    const storedUser = getCookie('user');
    const storedToken = getCookie('token');

    if (storedUser && storedToken) {
      const userData = JSON.parse(decodeURIComponent(storedUser));
      setUser({
        ...userData,
        token: storedToken
      });
    }
    setLoading(false);
  }, []);

  const saveUser = (userData, token) => {
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();

    // Store user data and token separately in cookies
    document.cookie = `user=${encodeURIComponent(JSON.stringify(userData))}; expires=${expires}; path=/; SameSite=Strict`;
    document.cookie = `token=${encodeURIComponent(token)}; expires=${expires}; path=/; SameSite=Strict`;

    // Set user state with token included
    setUser({
      ...userData,
      token: token
    });
  };

  const logout = () => {
    // Clear both cookies
    document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict';
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict';
    setUser(null);
  };

  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, loading, saveUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}