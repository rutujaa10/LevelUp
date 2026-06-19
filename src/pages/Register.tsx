import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, Zap, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);

  // AI Coach setup (optional)
  const [showCoach, setShowCoach] = useState(false);
  const [coachingEnabled, setCoachingEnabled] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [morningTime, setMorningTime] = useState('06:30');
  const [eveningTime, setEveningTime] = useState('19:00');
  const [coachPersonality, setCoachPersonality] = useState('motivational');

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

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (coachingEnabled && !whatsapp) {
      setError('Enter your WhatsApp number to enable AI coaching.');
      return;
    }

    const payload: any = {
      name, email, password,
      age: age || undefined,
      gender: gender || undefined,
    };

    if (coachingEnabled) {
      payload.coachingEnabled = true;
      payload.whatsapp = whatsapp;
      payload.coachPersonality = coachPersonality;
      payload.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (morningTime) payload.preferredMorningWorkoutTime = morningTime;
      if (eveningTime) payload.preferredEveningWorkoutTime = eveningTime;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok) {
          login(data.token, data.user);
          navigate('/app');
        } else {
          setError(data.error || 'Registration failed');
        }
      } else {
        setError('Invalid response from server');
      }
    } catch {
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
          <p className="text-gray-500 text-sm font-medium tracking-wide uppercase">Create your account</p>
        </div>
        <p className="mt-2 text-center text-sm text-gray-400">
          Already have an account? <Link to="/login" className="font-medium text-white hover:text-gray-300">Sign in</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-zinc-800">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && <div className="text-red-500 text-sm text-center bg-red-900/20 p-3 rounded-md border border-red-900/50">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-300">Name</label>
              <div className="mt-1">
                <input type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-zinc-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-white focus:border-white sm:text-sm bg-black text-white" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Email address</label>
              <div className="mt-1">
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-zinc-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-white focus:border-white sm:text-sm bg-black text-white" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Password <span className="text-gray-500 font-normal">(min 8 characters)</span>
              </label>
              <div className="mt-1">
                <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-zinc-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-white focus:border-white sm:text-sm bg-black text-white" />
              </div>
              {password.length > 0 && password.length < 8 && (
                <p className="mt-1 text-xs text-red-400">{8 - password.length} more character{8 - password.length !== 1 ? 's' : ''} needed</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Age <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <div className="mt-1">
                  <input type="number" min="13" max="100" value={age} onChange={e => setAge(e.target.value)}
                    placeholder="e.g. 25"
                    className="appearance-none block w-full px-3 py-2 border border-zinc-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-white focus:border-white sm:text-sm bg-black text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Gender <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <div className="mt-1">
                  <select value={gender} onChange={e => setGender(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-white focus:border-white sm:text-sm bg-black text-white">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500">Age and gender improve calorie target accuracy using the Mifflin-St Jeor formula.</p>

            {/* AI Coach Setup */}
            <div className="border border-zinc-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowCoach(!showCoach)}
                className="w-full flex items-center justify-between px-4 py-3 bg-zinc-800/50 hover:bg-zinc-800 transition-colors text-left"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  AI Coach on WhatsApp
                  <span className="text-xs text-gray-500 font-normal">(optional)</span>
                </span>
                {showCoach ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {showCoach && (
                <div className="px-4 pb-4 pt-3 space-y-4 border-t border-zinc-700">
                  <p className="text-xs text-gray-500">Get personalized workout reminders & nutrition insights powered by Gemini AI — based on your actual data, not generic messages.</p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Enable AI coaching</span>
                    <button
                      type="button"
                      onClick={() => setCoachingEnabled(!coachingEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${coachingEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${coachingEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {coachingEnabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">WhatsApp Number</label>
                        <input
                          type="tel"
                          value={whatsapp}
                          onChange={e => setWhatsapp(e.target.value)}
                          placeholder="+919137670761"
                          className="appearance-none block w-full px-3 py-2 border border-zinc-700 rounded-md placeholder-gray-500 focus:outline-none focus:border-white sm:text-sm bg-black text-white"
                        />
                        <p className="mt-1 text-xs text-gray-500">Include country code, e.g. +91 for India</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Morning time</label>
                          <input type="time" value={morningTime} onChange={e => setMorningTime(e.target.value)}
                            className="block w-full px-3 py-2 border border-zinc-700 rounded-md focus:outline-none focus:border-white sm:text-sm bg-black text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Evening time</label>
                          <input type="time" value={eveningTime} onChange={e => setEveningTime(e.target.value)}
                            className="block w-full px-3 py-2 border border-zinc-700 rounded-md focus:outline-none focus:border-white sm:text-sm bg-black text-white" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Coach style</label>
                        <select value={coachPersonality} onChange={e => setCoachPersonality(e.target.value)}
                          className="block w-full px-3 py-2 border border-zinc-700 rounded-md focus:outline-none focus:border-white sm:text-sm bg-black text-white">
                          <option value="motivational">Motivational</option>
                          <option value="friendly">Friendly</option>
                          <option value="strict">Strict</option>
                          <option value="funny">Funny</option>
                          <option value="competitive">Competitive</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div>
              <button type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors">
                Sign up
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

            <button onClick={handleDemoLogin} disabled={demoLoading}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 hover:border-emerald-500/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Zap className="w-4 h-4" />
              {demoLoading ? 'Loading demo…' : 'Continue with Demo Account'}
            </button>
            <p className="mt-2 text-center text-xs text-gray-500">
              Explore LevelUp with 10 weeks of pre-filled data — no sign up needed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
