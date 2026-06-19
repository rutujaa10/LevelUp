import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Dumbbell, Clock, Flame, X, Play, Copy, Trash2 } from 'lucide-react';
import ActiveWorkout from '../components/ActiveWorkout';
import CompletedWorkoutModal from '../components/CompletedWorkoutModal';

export default function Workouts() {
  const { token } = useAuth();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<any>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    split: 'Push',
    duration: '',
    notes: '',
    exerciseName: '',
    templateId: ''
  });

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        // Fetch active workout first
        const activeRes = await fetch('/api/workouts/active', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (activeRes.ok) {
          const contentType = activeRes.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const activeData = await activeRes.json();
            if (activeData) {
              setActiveWorkout(activeData);
            }
          }
        }

        // Fetch completed workouts
        const res = await fetch('/api/workouts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await res.json();
            setWorkouts(data);
          }
        }

        // Fetch templates
        const tplRes = await fetch('/api/workouts/templates', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (tplRes.ok) {
          const contentType = tplRes.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await tplRes.json();
            setTemplates(data);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkouts();
  }, [token]);

  const handleStartWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body: any = {
        split: formData.split,
      };
      
      if (formData.templateId) {
        body.templateId = formData.templateId;
      } else {
        body.exercises = formData.exerciseName ? [{ name: formData.exerciseName, sets: [{ weight: 0, reps: 0, completed: false }] }] : [];
      }

      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await res.json();
          setActiveWorkout(data);
          setShowModal(false);
          setFormData({ split: 'Push', duration: '', notes: '', exerciseName: '', templateId: '' });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWorkoutComplete = () => {
    setActiveWorkout(null);
    // Refresh history and templates
    fetch('/api/workouts', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setWorkouts(data));
      
    fetch('/api/workouts/templates', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setTemplates(data));
  };

  if (activeWorkout) {
    return <ActiveWorkout workout={activeWorkout} onComplete={handleWorkoutComplete} />;
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workouts</h1>
          <p className="text-gray-400 mt-2">Track your sessions and level up your strength.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-500 text-black px-4 py-2 rounded-xl font-bold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Play className="w-5 h-5 fill-current" />
          <span className="hidden sm:inline">New Custom Workout</span>
        </button>
      </header>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading workouts...</div>
      ) : (
        <div className="space-y-8">
          {templates.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Your Routines</h2>
                <button 
                  onClick={async () => {
                    if (confirm('This will replace your current routines with the default Push/Pull/Legs routines. Are you sure?')) {
                      try {
                        const res = await fetch('/api/workouts/templates/seed', {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setTemplates(data);
                        }
                      } catch (err) {
                        console.error('Failed to restore defaults', err);
                      }
                    }
                  }}
                  className="text-sm text-emerald-500 hover:text-emerald-400 font-medium"
                >
                  Restore Defaults
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map(tpl => (
                  <div key={tpl._id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-700 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold">{tpl.name || tpl.split}</h3>
                        <p className="text-sm text-gray-400 mt-1">{tpl.exercises?.length || 0} exercises</p>
                      </div>
                      <button 
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/workouts', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`
                              },
                              body: JSON.stringify({
                                split: tpl.split,
                                templateId: tpl._id
                              })
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setActiveWorkout(data);
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors"
                        title="Start Workout"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tpl.exercises?.slice(0, 3).map((ex: any, i: number) => (
                        <span key={i} className="px-2 py-1 bg-black border border-zinc-800 rounded-md text-xs text-gray-400">
                          {ex.name}
                        </span>
                      ))}
                      {tpl.exercises?.length > 3 && (
                        <span className="px-2 py-1 bg-black border border-zinc-800 rounded-md text-xs text-gray-500">
                          +{tpl.exercises.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold mb-4">Recent Workouts</h2>
            {workouts.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-2xl text-center">
                <Dumbbell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No workouts yet</h3>
                <p className="text-gray-400 mb-6">Start logging your sessions to see your progress.</p>
                <button 
                  onClick={() => setShowModal(true)}
                  className="bg-emerald-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Start First Workout
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {workouts.map((workout) => (
                  <div
                    key={workout._id}
                    className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-700 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 cursor-pointer" onClick={() => setSelectedWorkout(workout)}>
                        <h3 className="text-xl font-bold">{workout.name || workout.split || 'Custom Workout'}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {new Date(workout.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        {workout.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {workout.duration} min
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Flame className="w-4 h-4 text-orange-500" />
                          {workout.exercises?.length || 0} exercises
                        </div>
                        <button
                          onClick={async () => {
                            if (!confirm('Delete this workout from history?')) return;
                            try {
                              const res = await fetch(`/api/workouts/${workout._id}`, {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              if (res.ok) setWorkouts(prev => prev.filter(w => w._id !== workout._id));
                            } catch (err) { console.error(err); }
                          }}
                          className="p-1.5 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-900/10"
                          title="Delete workout"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4 cursor-pointer" onClick={() => setSelectedWorkout(workout)}>
                      {workout.exercises?.slice(0, 3).map((ex: any, i: number) => (
                        <span key={i} className="px-3 py-1 bg-black border border-zinc-800 rounded-full text-xs text-gray-300">
                          {ex.name}
                        </span>
                      ))}
                      {workout.exercises?.length > 3 && (
                        <span className="px-3 py-1 bg-black border border-zinc-800 rounded-full text-xs text-gray-500">
                          +{workout.exercises.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Workout Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Log Workout</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleStartWorkout} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Split / Type</label>
                <select 
                  value={formData.split}
                  onChange={(e) => setFormData({...formData, split: e.target.value})}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-white"
                >
                  <option value="Push">Push</option>
                  <option value="Pull">Pull</option>
                  <option value="Legs">Legs</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">First Exercise (Optional)</label>
                <input 
                  type="text" 
                  value={formData.exerciseName}
                  onChange={(e) => setFormData({...formData, exerciseName: e.target.value})}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-white"
                  placeholder="e.g. Bench Press"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-500 text-black font-bold py-3 rounded-xl hover:bg-emerald-400 transition-colors mt-6 shadow-lg shadow-emerald-500/20"
              >
                Start Session
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Completed Workout Details Modal */}
      {selectedWorkout && (
        <CompletedWorkoutModal 
          workout={selectedWorkout} 
          onClose={() => setSelectedWorkout(null)} 
        />
      )}
    </div>
  );
}
