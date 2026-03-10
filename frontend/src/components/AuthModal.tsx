import { useState, useEffect } from 'react';
import { api, authStorage } from '../api';
import './AuthModal.scss';

export type AuthModalMode = 'login' | 'register';

interface AuthModalProps {
  open: boolean;
  initialMode?: AuthModalMode;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({
  open,
  initialMode = 'login',
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
    }
  }, [open, initialMode]);

  if (!open) return null;

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(email.trim(), password);
      authStorage.setToken(res.accessToken);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Login failed. Check email/password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.register({
        email: email.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      const res = await api.login(email.trim(), password);
      authStorage.setToken(res.accessToken);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className='authModalBackdrop' onClick={handleBackdropClick}>
      <div
        className='authModalCard'
        onClick={(e) => e.stopPropagation()}
        role='dialog'
        aria-modal='true'
        aria-labelledby='auth-modal-title'
      >
        <div className='authModalCard__header'>
          <h2 id='auth-modal-title' className='authModalCard__title'>
            {mode === 'login' ? 'Login' : 'Register'}
          </h2>
          <button
            type='button'
            className='authModalCard__close'
            onClick={onClose}
            aria-label='Close'
          >
            ✕
          </button>
        </div>

        <div className='authModalCard__tabs'>
          <button
            type='button'
            className={`authModalCard__tab ${mode === 'login' ? 'authModalCard__tab--active' : ''}`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type='button'
            className={`authModalCard__tab ${mode === 'register' ? 'authModalCard__tab--active' : ''}`}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        {mode === 'login' ? (
          <form className='authModalCard__form' onSubmit={handleLogin}>
            <label className='label'>
              Email
              <input
                className='input'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type='email'
                placeholder='you@example.com'
                required
              />
            </label>
            <label className='label'>
              Password
              <input
                className='input'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type='password'
                placeholder='••••••••'
                required
              />
            </label>
            {error ? <div className='alert'>{error}</div> : null}
            <div className='authModalCard__actions'>
              <button className='btn btn--primary' type='submit' disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
              <button className='btn' type='button' onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <form className='authModalCard__form' onSubmit={handleRegister}>
            <label className='label'>
              First name
              <input
                className='input'
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                type='text'
                placeholder='John'
                required
              />
            </label>
            <label className='label'>
              Last name
              <input
                className='input'
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                type='text'
                placeholder='Doe'
                required
              />
            </label>
            <label className='label'>
              Email
              <input
                className='input'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type='email'
                placeholder='you@example.com'
                required
              />
            </label>
            <label className='label'>
              Password
              <input
                className='input'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type='password'
                placeholder='••••••••'
                required
                minLength={1}
              />
            </label>
            {error ? <div className='alert'>{error}</div> : null}
            <div className='authModalCard__actions'>
              <button className='btn btn--primary' type='submit' disabled={loading}>
                {loading ? 'Creating account...' : 'Register'}
              </button>
              <button className='btn' type='button' onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
