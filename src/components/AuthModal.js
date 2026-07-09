import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setMode('login');
    setUsername('');
    setPassword('');
    setConfirm('');
    setMessage('');
    setLoading(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(username, password);
        setMessage('Login successful!');
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        if (password !== confirm) {
          throw new Error('Passwords do not match');
        }
        await signup(username, password);
        setMessage('Account created successfully!');
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch (error) {
      setMessage(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setMessage('');
    setPassword('');
    setConfirm('');
  };

  return (
    <div className={`auth-backdrop ${!isOpen ? 'hidden' : ''}`}>
      <div className="auth-modal">
        <div className="auth-head">
          <div>
            <h2>{mode === 'login' ? 'Login to PlanMyCapital' : 'Create Account'}</h2>
            <p>
              {mode === 'login'
                ? 'Use a username with no spaces and your password.'
                : 'Sign up for a new PlanMyCapital account to save your calculations.'}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close login">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => handleModeChange('login')}
          >
            Login
          </button>
          <button
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => handleModeChange('signup')}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="authUsername">Username</label>
            <input
              id="authUsername"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="field">
            <label htmlFor="authPass">Password</label>
            <input
              id="authPass"
              type="password"
              placeholder="Account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              disabled={loading}
            />
          </div>

          {mode === 'signup' && (
            <div className="field">
              <label htmlFor="authConfirm">Confirm password</label>
              <input
                id="authConfirm"
                type="password"
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
              />
            </div>
          )}

          <button
            className="auth-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Please wait...' : 'Continue'}
          </button>

          <div className={`auth-msg ${message.includes('error') || message.includes('does not') ? 'err' : message ? 'ok' : ''}`}>
            {message}
          </div>
        </form>
      </div>
    </div>
  );
}
