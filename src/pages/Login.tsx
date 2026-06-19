import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, Zap } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@levelup.com', password: 'demo123' })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        navigate('/app');
      } else {
        setError('Demo account unavailable. Please try again.');
      }
    } catch {
      setError('Network error');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await res.json();
        if (res.ok) {
          login(data.token, data.user);
          navigate('/app');
        } else {
          setError(data.error || 'Login failed');
        }
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-10 h-10 text-emerald-500" />
            <span className="text-3xl font-extrabold tracking-tight text-white">LevelUp</span>
          </div>
          <p className="text-gray-500 text-sm font-medium tracking-wide uppercase">Sign in to your account</p>
        </div>
        <p className="mt-4 text-center text-sm text-gray-400">
          No account? <Link to="/register" className="font-medium text-white hover:text-gray-300">Create one free</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-zinc-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="text-red-500 text-sm text-center bg-red-900/20 p-3 rounded-md border border-red-900/50">{error}</div>}
            
            <div>
              <label className="block text-sm font-medium text-gray-300">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-zinc-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-white focus:border-white sm:text-sm bg-black text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-zinc-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-white focus:border-white sm:text-sm bg-black text-white"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors"
              >
                Sign in
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-zinc-900 text-gray-400">or</span>
              </div>
            </div>

            <button
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 hover:border-emerald-500/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4" />
              {demoLoading ? 'Loading demo…' : 'Continue with Demo Account'}
            </button>
            <p className="mt-2 text-center text-xs text-gray-500">
              Explore LevelUp with 90 days of pre-filled data — no sign up needed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
