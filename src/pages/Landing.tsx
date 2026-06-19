import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Activity, Brain, TrendingUp, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
      {/* Navigation */}
      <nav className="border-b border-zinc-800 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Dumbbell className="w-8 h-8 text-emerald-500" />
            <span className="text-xl font-bold tracking-tight">LevelUp</span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/app" className="text-sm font-medium bg-emerald-500 text-black px-4 py-2 rounded-full hover:bg-emerald-400 transition-colors">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-black to-black -z-10"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8">
              Transform your body.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Elevate your mind.
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-gray-400 mb-10">
              LevelUp is the ultimate fitness companion. Track your workouts, optimize your diet, and get personalized AI coaching all in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link to="/app" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-emerald-400 transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)]">
                  Go to Dashboard <ChevronRight className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-emerald-400 transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)]">
                    Start Your Journey <ChevronRight className="w-5 h-5" />
                  </Link>
                  <Link to="/login" className="w-full sm:w-auto flex items-center justify-center px-8 py-4 rounded-full font-bold text-lg text-white border border-zinc-700 hover:bg-zinc-900 transition-colors">
                    I already have an account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-zinc-900">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need to succeed</h2>
            <p className="text-gray-400">Stop guessing. Start tracking. See results.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl hover:bg-zinc-900 transition-colors">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Tracking</h3>
              <p className="text-gray-400 leading-relaxed">
                Log your sets, reps, and weights with ease. Watch your progress grow week over week with detailed charts and history.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl hover:bg-zinc-900 transition-colors">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Diet Management</h3>
              <p className="text-gray-400 leading-relaxed">
                Calculate your macros, track your daily intake, and ensure your nutrition aligns with your fitness goals.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl hover:bg-zinc-900 transition-colors">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center mb-6">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Coaching</h3>
              <p className="text-gray-400 leading-relaxed">
                Get personalized advice, workout adjustments, and answers to your fitness questions from our intelligent AI coach.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-12 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} LevelUp Fitness. All rights reserved.</p>
      </footer>
    </div>
  );
}
