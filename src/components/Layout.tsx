import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, User, Dumbbell, Utensils, MessageSquare, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/app', label: 'Dashboard', icon: Home },
    { path: '/app/profile', label: 'Profile', icon: User },
    { path: '/app/workouts', label: 'Workouts', icon: Dumbbell },
    { path: '/app/diet', label: 'Diet', icon: Utensils },
    { path: '/app/chatbot', label: 'AI Coach', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-800 bg-zinc-950 p-4">
        <Link to="/" className="flex items-center gap-2 mb-8 px-2 hover:opacity-80 transition-opacity">
          <Dumbbell className="w-8 h-8 text-white" />
          <h1 className="text-2xl font-bold tracking-tight text-white">LevelUp</h1>
        </Link>
        
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive 
                    ? 'bg-white text-black font-medium' 
                    : 'text-gray-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 mt-auto text-gray-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-gray-800 bg-zinc-950 sticky top-0 z-40">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Dumbbell className="w-6 h-6 text-emerald-500" />
            <h1 className="text-xl font-bold tracking-tight text-white">LevelUp</h1>
          </Link>
          <button onClick={logout} className="text-gray-400 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <div className="max-w-5xl mx-auto w-full p-4 md:p-8 flex-1">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-gray-800 flex justify-around p-3 z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
                isActive ? 'text-white' : 'text-gray-500'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
