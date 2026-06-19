import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Flame, TrendingUp, Calendar, Edit2, Dumbbell, Scale, Utensils, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function utcDay(date: Date): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
}

export default function Dashboard() {
  const { user, token } = useAuth();
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState(4);
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, workoutsRes] = await Promise.all([
          fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/workouts', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (userRes.ok) {
          const data = await userRes.json();
          setMeasurements(data.measurements || []);
          if (data.weeklyWorkoutGoal) setWeeklyGoal(data.weeklyWorkoutGoal);
        }
        if (workoutsRes.ok) {
          const data = await workoutsRes.json();
          setWorkouts(data || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [token]);

  const handleGoalChange = async (newGoal: number) => {
    setWeeklyGoal(newGoal);
    setIsEditingGoal(false);
    try {
      await fetch('/api/auth/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ weeklyWorkoutGoal: newGoal })
      });
    } catch (err) {
      console.error('Failed to update goal', err);
    }
  };

  const chartData = measurements.map(m => ({
    date: new Date(m.date).toLocaleDateString(),
    weight: m.weight
  })).slice(-10);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const workoutsThisWeek = workouts.filter(w => new Date(w.date) >= oneWeekAgo).length;

  // Streak calculation using UTC midnight normalization (timezone-safe)
  let currentStreak = 0;
  if (workouts.length > 0) {
    const dayStrings = workouts.map(w => utcDay(new Date(w.date)));
    const uniqueDays = [...new Set(dayStrings)].sort((a, b) => (a < b ? 1 : -1));

    const todayUTC = new Date();
    let checkDay = utcDay(todayUTC);

    // If no workout today, start streak check from yesterday
    if (uniqueDays[0] !== checkDay) {
      const yesterday = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate() - 1));
      checkDay = utcDay(yesterday);
    }

    for (const day of uniqueDays) {
      if (day === checkDay) {
        currentStreak++;
        // Parse current checkDay and subtract one UTC day
        const [y, m, d] = checkDay.split('-').map(Number);
        checkDay = utcDay(new Date(Date.UTC(y, m, d - 1)));
      } else {
        break;
      }
    }
  }

  const isNewUser = workouts.length === 0 && measurements.length === 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-gray-400 mt-2">Ready to level up today?</p>
      </header>

      {isNewUser ? (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl text-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <Dumbbell className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Get started with LevelUp</h2>
            <p className="text-gray-400 max-w-md mx-auto">Complete these 3 steps to start seeing your progress on this dashboard.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/app/profile" className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-emerald-500/40 transition-colors group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Scale className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-xs font-bold text-gray-500 bg-zinc-800 px-2 py-1 rounded-full">Step 1</span>
              </div>
              <h3 className="font-bold mb-1">Log your measurements</h3>
              <p className="text-sm text-gray-400 mb-4">Add your current weight and body metrics to unlock calorie targets.</p>
              <span className="text-sm text-emerald-400 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Go to Profile <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link to="/app/workouts" className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-emerald-500/40 transition-colors group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="text-xs font-bold text-gray-500 bg-zinc-800 px-2 py-1 rounded-full">Step 2</span>
              </div>
              <h3 className="font-bold mb-1">Start your first workout</h3>
              <p className="text-sm text-gray-400 mb-4">Use a Push/Pull/Legs template or build your own custom session.</p>
              <span className="text-sm text-emerald-400 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Go to Workouts <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link to="/app/diet" className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-emerald-500/40 transition-colors group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-orange-400" />
                </div>
                <span className="text-xs font-bold text-gray-500 bg-zinc-800 px-2 py-1 rounded-full">Step 3</span>
              </div>
              <h3 className="font-bold mb-1">Track your nutrition</h3>
              <p className="text-sm text-gray-400 mb-4">Log meals to hit your calorie and macro goals for your current phase.</p>
              <span className="text-sm text-emerald-400 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Go to Diet <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-400 font-medium">Current Streak</h3>
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-3xl font-bold mt-4">{currentStreak} Days</p>
              <p className="text-sm text-gray-500 mt-1">{currentStreak > 0 ? 'Keep it up!' : 'Start your streak today!'}</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative group">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-400 font-medium">Workouts This Week</h3>
                <Activity className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold mt-4">{workoutsThisWeek}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-500">Goal: </p>
                {isEditingGoal ? (
                  <select
                    value={weeklyGoal}
                    onChange={e => handleGoalChange(Number(e.target.value))}
                    className="bg-zinc-800 text-white text-sm rounded px-1 py-0.5 border border-zinc-700 focus:outline-none"
                    autoFocus
                    onBlur={() => setIsEditingGoal(false)}
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(num => <option key={num} value={num}>{num}</option>)}
                  </select>
                ) : (
                  <div className="flex items-center gap-1 cursor-pointer hover:text-white text-sm text-gray-500 transition-colors" onClick={() => setIsEditingGoal(true)}>
                    <span>{weeklyGoal}</span>
                    <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-400 font-medium">Current Weight</h3>
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold mt-4">
                {measurements.length > 0 ? `${measurements[measurements.length - 1].weight} kg` : '--'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {measurements.length > 1
                  ? `${(measurements[measurements.length - 1].weight - measurements[measurements.length - 2].weight).toFixed(1)} kg from last log`
                  : 'Log more to see trend'}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-400 font-medium">Total Workouts</h3>
                <Calendar className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold mt-4">{workouts.length}</p>
              <p className="text-sm text-gray-500 mt-1">Sessions logged</p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-6">Weight Progress</h3>
            {chartData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888' }} />
                    <YAxis stroke="#888" tick={{ fill: '#888' }} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#fff"
                      strokeWidth={3}
                      dot={{ fill: '#fff', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#000', stroke: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-gray-500 gap-3">
                <Scale className="w-8 h-8 text-gray-700" />
                <p>No weight data yet.</p>
                <Link to="/app/profile" className="text-sm text-emerald-400 hover:text-emerald-300">Log your first measurement →</Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
