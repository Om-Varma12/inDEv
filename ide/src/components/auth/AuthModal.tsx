import { useState } from 'react';
import { signIn, signUp, confirmSignUp } from 'aws-amplify/auth';
import { Modal } from '../ui';
import { useAuth } from '../../contexts/AuthContext';

type AuthState = 'login' | 'signup' | 'confirm_signup';

export const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal } = useAuth();
  const [authState, setAuthState] = useState<AuthState>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const resetState = () => {
    setAuthState('login');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setConfirmationCode('');
    setError('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetState();
    closeAuthModal();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      // Assuming email is used as username
      await signIn({ username: email, password });
      handleClose();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const { isSignUpComplete, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });

      if (!isSignUpComplete && nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setAuthState('confirm_signup');
      } else if (isSignUpComplete) {
        setAuthState('login');
        setError('Sign up complete! Please log in.'); // Though usually auto-login is preferred, sticking to simple flow
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: email,
        confirmationCode,
      });
      if (isSignUpComplete) {
        setAuthState('login');
        setPassword(''); // Let them log in freshly
        setError('Email verified successfully! Please log in.');
      }
    } catch (err: any) {
      setError(err.message || 'Confirmation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={handleClose}
      title={
        authState === 'login'
          ? 'Log in to InDev'
          : authState === 'signup'
          ? 'Create an account'
          : 'Confirm your email'
      }
    >
      <div className="flex flex-col gap-4">
        {error && (
          <div className="bg-error/10 text-error p-3 rounded-md text-sm border border-error/20">
            {error}
          </div>
        )}

        {authState === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-on-surface-variant">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-on-surface focus:outline-none focus:border-primary transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-on-surface-variant">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-on-surface focus:outline-none focus:border-primary transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full bg-primary text-on-primary font-medium py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : 'Log in'}
            </button>
            <div className="text-center text-sm text-on-surface-variant mt-2">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setAuthState('signup'); setError(''); }}
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </button>
            </div>
          </form>
        )}

        {authState === 'signup' && (
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-on-surface-variant">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-on-surface focus:outline-none focus:border-primary transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-on-surface-variant">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-on-surface focus:outline-none focus:border-primary transition-colors"
                placeholder="••••••••"
                minLength={8}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-on-surface-variant">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-on-surface focus:outline-none focus:border-primary transition-colors"
                placeholder="••••••••"
                minLength={8}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full bg-primary text-on-primary font-medium py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
            <div className="text-center text-sm text-on-surface-variant mt-2">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setAuthState('login'); setError(''); }}
                className="text-primary hover:underline font-medium"
              >
                Log in
              </button>
            </div>
          </form>
        )}

        {authState === 'confirm_signup' && (
          <form onSubmit={handleConfirmSignup} className="flex flex-col gap-4">
            <p className="text-sm text-on-surface-variant">
              We sent a confirmation code to <strong>{email}</strong>. Please enter it below to verify your email.
            </p>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-on-surface-variant">Confirmation Code</label>
              <input
                type="text"
                required
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-on-surface focus:outline-none focus:border-primary transition-colors tracking-widest"
                placeholder="000000"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full bg-primary text-on-primary font-medium py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>
            <div className="text-center text-sm text-on-surface-variant mt-2">
              <button
                type="button"
                onClick={() => { setAuthState('login'); setError(''); }}
                className="text-primary hover:underline font-medium"
              >
                Back to log in
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
