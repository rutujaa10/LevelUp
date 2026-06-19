import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, TrendingUp, Activity } from 'lucide-react';

interface ExerciseHistoryProps {
  exerciseName: string;
  onClose: () => void;
}

export default function ExerciseHistory({ exerciseName, onClose }: ExerciseHistoryProps) {
  const { token } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!exerciseName) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/workouts/history/${encodeURIComponent(exerciseName)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.indexOf("application/json") !== -1) {
          const data = await res.json();
          setHistory(data);
        } else {
          console.error("Expected JSON response but got something else");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [exerciseName, token]);

  const chartData = history.map(workout => {
    const exercise = workout.exercises.find((e: any) => e.name === exerciseName);
    if (!exercise) return null;
    
    // Find max weight and calculate total volume
    let maxWeight = 0;
    let totalVolume = 0;
    
    exercise.sets.forEach((set: any) => {
      if (set.completed) {
        if (set.weight > maxWeight) maxWeight = set.weight;
        totalVolume += (set.weight * set.reps);
      }
    });

    return {
      date: new Date(workout.date).toLocaleDateString(),
      maxWeight,
      totalVolume
    };
  }).filter(Boolean);

  const currentPR = chartData.length > 0 ? Math.max(...chartData.map(d => d.maxWeight)) : 0;
  const lastWeight = chartData.length > 0 ? chartData[chartData.length - 1].maxWeight : 0;
  const suggestedWeight = lastWeight > 0 ? lastWeight + 2.5 : 0;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-4xl my-8 relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white"
        >
          ✕
        </button>
        
        <h2 className="text-3xl font-bold mb-8">{exerciseName} History</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 text-yellow-500 rounded-xl">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Personal Record</p>
              <p className="text-2xl font-bold">{currentPR} kg</p>
            </div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 text-blue-500 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Last Lifted</p>
              <p className="text-2xl font-bold">{lastWeight} kg</p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-500 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-medium">Suggested Next</p>
              <p className="text-2xl font-bold">{suggestedWeight} kg</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading history...</div>
        ) : chartData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No history found for this exercise.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
              <h3 className="text-lg font-bold mb-6">Weight Progression</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="date" stroke="#888" tick={{fill: '#888'}} />
                    <YAxis stroke="#888" tick={{fill: '#888'}} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="maxWeight" name="Max Weight (kg)" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6'}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
              <h3 className="text-lg font-bold mb-6">Volume Progression</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="date" stroke="#888" tick={{fill: '#888'}} />
                    <YAxis stroke="#888" tick={{fill: '#888'}} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="totalVolume" name="Total Volume (kg)" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
