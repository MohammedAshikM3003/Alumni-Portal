import { createContext, useContext, useState, useEffect } from 'react';

const TokenAuthContext = createContext(null);

export const useTokenAuth = () => useContext(TokenAuthContext);

export default function TokenAuthProvider({ children }) {
  const [tokenSession, setTokenSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore token session from sessionStorage on mount
  useEffect(() => {
    const storedSession = sessionStorage.getItem('tokenSession');
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        // Check if session is still valid (not expired)
        if (parsed.expiresAt && new Date(parsed.expiresAt) > new Date()) {
          setTokenSession(parsed);
        } else {
          // Expired session, clear it
          sessionStorage.removeItem('tokenSession');
        }
      } catch (error) {
        console.error('Error parsing token session:', error);
        sessionStorage.removeItem('tokenSession');
      }
    }
    setLoading(false);
  }, []);

  // Login with token - called after successful token validation
  const loginWithToken = (tokenData) => {
    const session = {
      token: tokenData.token,
      recipientEmail: tokenData.recipientEmail,
      mail: tokenData.mail,
      expiresAt: tokenData.expiresAt,
      loggedInAt: new Date().toISOString(),
      isTokenAuth: true
    };

    sessionStorage.setItem('tokenSession', JSON.stringify(session));
    setTokenSession(session);

    console.log('✅ Token login successful for:', tokenData.recipientEmail);
    return session;
  };

  // Logout - clear token session
  const logoutToken = () => {
    sessionStorage.removeItem('tokenSession');
    setTokenSession(null);
    console.log('Token session cleared');
  };

  // Mark token as used after form submission
  const markTokenUsed = () => {
    if (tokenSession) {
      const updatedSession = {
        ...tokenSession,
        isUsed: true,
        usedAt: new Date().toISOString()
      };
      sessionStorage.setItem('tokenSession', JSON.stringify(updatedSession));
      setTokenSession(updatedSession);
    }
  };

  // Check if user is logged in via token
  const isTokenLoggedIn = !!tokenSession && !tokenSession.isUsed;

  // Get current token
  const getCurrentToken = () => tokenSession?.token || null;

  return (
    <TokenAuthContext.Provider value={{
      tokenSession,
      isTokenLoggedIn,
      loading,
      loginWithToken,
      logoutToken,
      markTokenUsed,
      getCurrentToken
    }}>
      {children}
    </TokenAuthContext.Provider>
  );
}
