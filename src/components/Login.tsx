import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [name, setName] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check for admin credentials first
      if (email === 'admin@iiitdm.ac.in') {
        try {
          const { user } = await authService.signInAdmin(email, password);
          localStorage.setItem('adminToken', 'admin-authenticated');
          localStorage.setItem('userName', 'Admin');
          localStorage.setItem('userEmail', email);
          localStorage.setItem('userId', user.id);
          navigate('/admin/dashboard');
          return;
        } catch (adminError: any) {
          setError(adminError.message || 'Admin login failed');
          return;
        }
      }

      if (isLogin) {
        // Regular user login
        const { user } = await authService.signIn(email, password);
        if (user) {
          localStorage.setItem('userName', user.user_metadata?.name || email.split('@')[0].toUpperCase());
          localStorage.setItem('userEmail', user.email || '');
          localStorage.setItem('userId', user.id);
          navigate('/home');
        }
      } else {
        // User signup
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        const { user } = await authService.signUp(email, password, name, studentId);
        if (user) {
          localStorage.setItem('userName', user.user_metadata?.name || email.split('@')[0].toUpperCase());
          localStorage.setItem('userEmail', user.email || '');
          localStorage.setItem('userId', user.id);
          setError('Account created successfully! Please check your email to verify your account, then login. If you don\'t receive an email, contact the admin.');
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await authService.signInWithGoogle();
    } catch (error: any) {
      setError(error.message || 'Google login failed');
    }
  };

  return (
    <div className="login-background">
      <img 
        src="https://imgs.search.brave.com/ZsY8in-PibjX4NPQmLpQK2yJI9HSJWoT7I3vZOWioiY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvZW4vdGh1bWIv/NC80YS9JbmRpYW5f/SW5zdGl0dXRlX29m/X0luZm9ybWF0aW9u/X1RlY2hub2xvZ3kl/MkNfRGVzaWduX2Fu/ZF9NYW51ZmFjdHVy/aW5nJTJDX0thbmNo/ZWVwdXJhbV9sb2dv/LnBuZy81MTJweC1J/bmRpYW5fSW5zdGl0/dXRlX29mX0luZm9y/bWF0aW9uX1RlY2hu/b2xvZ3klMkNfRGVz/aWduX2FuZF9NYW51/ZmFjdHVyaW5nJTJD/X0thbmNoZWVwdXJh/bV9sb2dvLnBuZw" 
        alt="IIITDM Gym Logo" 
        className="logo" 
        onClick={() => navigate('/home')}
        style={{ cursor: 'pointer' }}
      />
      <div className="login-container">
        <div className="login-header">
          <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p>{isLogin ? 'Please login to continue' : 'Sign up to get started'}</p>
        </div>

        {error && (
          <div className="error-message" style={{ 
            background: '#f44336', 
            color: 'white', 
            padding: '10px', 
            borderRadius: '5px', 
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name"
                  placeholder="Enter your full name" 
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="studentId">Student ID (Optional)</label>
                <input 
                  type="text" 
                  id="studentId" 
                  name="studentId"
                  placeholder="e.g., CS23B1027" 
                  value={studentId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStudentId(e.target.value)}
                />
              </div>
            </>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Institute Email ID</label>
            <input 
              type="email" 
              id="email" 
              name="email"
              placeholder="example@iiitdm.ac.in" 
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {/* New Confirm Password field */}
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input 
                type="password" 
                id="confirmPassword" 
                name="confirmPassword"
                placeholder="Confirm your password" 
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          )}
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
          
          <div className="auth-switch" style={{ textAlign: 'center', marginTop: '15px' }}>
            <button 
              type="button" 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#4CAF50', 
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
          </div>
          
          <div className="separator">
            <span>or</span>
          </div>
          <button type="button" className="google-btn" onClick={handleGoogleLogin}>
            <img src="https://www.google.com/favicon.ico" alt="Google" />
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;