import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import styles from './LoginGateway.module.css';
import NavBar from '../../components/Navbar/NavBar';
import { useAuth } from '../../context/authContext/authContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


export default function LoginGateway() {
  const navigate = useNavigate();
  const { saveUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLoginClick = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      setGoogleLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/google-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: codeResponse.access_token }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(data.message || 'Login failed');
          return;
        }

        saveUser(data.user, data.token);

        const role = data.user.role;
        if (role === 'alumni') navigate('/alumini/dashboard');
        else if (role === 'admin') navigate('/admin/dashboard');
        else if (role === 'coordinator') navigate('/coordinator/dashboard');
      } catch (error) {
        setError('Unable to connect to server');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setError('Google login failed');
      setGoogleLoading(false);
    },
    flow: 'implicit',
  });


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password }),
      });

      const data = await res.json();

      if(!data.success) {
        alert('User Not Found');
        return;
      }

      saveUser(data.user, data.token);

      const role = data.user.role;
      if (role === 'alumni') navigate('/alumini/dashboard');
      else if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'coordinator') navigate('/coordinator/dashboard');
    } catch (error) {
      setError('Unable to connect to server');
    }
  };


  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className={styles.container}>
      {/* Navigation Bar */}
      <NavBar isLanding={false } />
      
      {/* Particles Background */}
      <div className={styles.particlesContainer}>
        <div className={styles.particle} style={{ top: '10%', left: '15%' }}></div>
        <div className={styles.particle} style={{ top: '25%', left: '80%' }}></div>
        <div className={styles.particle} style={{ top: '60%', left: '5%' }}></div>
        <div className={styles.particle} style={{ top: '85%', left: '40%' }}></div>
        <div className={styles.particle} style={{ top: '45%', left: '90%' }}></div>
        <div className={styles.particle} style={{ top: '70%', left: '75%' }}></div>
        <div className={styles.particle} style={{ top: '20%', left: '30%' }}></div>
        <div className={styles.particle} style={{ top: '55%', left: '25%' }}></div>
        <div className={styles.particle} style={{ top: '15%', left: '60%' }}></div>
        <div className={styles.particle} style={{ top: '90%', left: '10%' }}></div>
        
        {/* Gradient Blurs */}
        <div className={styles.blurBlue}></div>
        <div className={styles.blurOrange}></div>
      </div>

      {/* Login Card */}
      <div className={styles.contentWrapper}>
        <br />
        <br />
        <div className={styles.glassCard}>
          
          {/* Logo & Header */}
          <div className={styles.headerSection}>
            <div className={styles.headerText}>
              <h1 className={styles.title}>Login Gateway</h1>
              <p className={styles.subtitle}>K.S.R. College of Engineering</p>
            </div>
          </div>

          {/* Login Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            
            {/* Email Input */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Email or Username</label>
              <div className={styles.inputWrapper}>
                <div className={styles.inputIconBox}>
                  <span className="material-symbols-outlined">person</span>
                </div>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="alumni@ksrce.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className={styles.inputGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Password</label>
                <button 
                  type="button"
                  onClick={handleForgotPassword} 
                  className={styles.forgotPassword}
                >
                  Forgot Password?
                </button>
              </div>
              <div className={styles.inputWrapper}>
                <div className={styles.inputIconBox}>
                  <span className="material-symbols-outlined">lock</span>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className={styles.loginButton}>
              <span>Log In</span>
              <span>→</span>
            </button>

          </form>

          {/* Divider */}
          <div className={styles.divider}>
            <div className={styles.dividerLine}></div>
            <span className={styles.dividerText}>OR CONTINUE WITH</span>
            <div className={styles.dividerLine}></div>
          </div>

          {/* Google Login */}
          <button
            type="button"
            className={styles.googleButton}
            onClick={() => handleGoogleLoginClick()}
            disabled={googleLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
