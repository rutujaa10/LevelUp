import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Check, X, Clock, BarChart2, Trash2 } from 'lucide-react';
import RestTimer from './RestTimer';
import ExerciseHistory from './ExerciseHistory';

export default function ActiveWorkout({ workout, onComplete }: { workout: any, onComplete: () => void }) {
  const { token } = useAuth();
  const [exercises, setExercises] = useState<any[]>(workout.exercises || []);
  const [activeRest, setActiveRest] = useState<{ seconds: number } | null>(null);
  const [viewHistoryFor, setViewHistoryFor] = useState<string | null>(null);
  const [previousPerformances, setPreviousPerformances] = useState<Record<string, any[]>>({});
  const [elapsed, setElapsed] = useState(0); // seconds since workout start
  const [showSaveRoutine, setShowSaveRoutine] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [routineSaved, setRoutineSaved] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const startTime = useRef<number>(new Date(workout.date).getTime());

  // Elapsed timer
  useEffect(() => {
    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchPrevious = async () => {
      const perfs: Record<string, any[]> = {};
      for (const ex of workout.exercises || []) {
        if (!ex.name || ex.name === 'New Exercise') continue;
        try {
          const res = await fetch(`/api/workouts/history/${encodeURIComponent(ex.name)}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const history = await res.json();
            if (history.length > 0) {
              const lastWorkout = history[history.length - 1];
              const lastEx = lastWorkout.exercises.find((e: any) => e.name === ex.name);
              if (lastEx) perfs[ex.name] = lastEx.sets;
            }
          }
        } catch (e) { /* ignore */ }
      }
      setPreviousPerformances(perfs);
    };
    fetchPrevious();
  }, [workout.exercises, token]);

  const updateWorkout = async (updatedExercises: any[]) => {
    try {
      await fetch(`/api/workouts/${workout._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ exercises: updatedExercises })
      });
    } catch (err) { console.error('Failed to update workout', err); }
  };

  const addExercise = () => {
    const updated = [...exercises, { name: 'New Exercise', muscleGroup: 'Other', restTime: 90, sets: [{ weight: 0, reps: 0, completed: false }] }];
    setExercises(updated);
    updateWorkout(updated);
  };

  const removeExercise = (idx: number) => {
    const updated = exercises.filter((_, i) => i !== idx);
    setExercises(updated);
    updateWorkout(updated);
  };

  const addSet = (exerciseIndex: number) => {
    const updated = [...exercises];
    const prevSets = updated[exerciseIndex].sets;
    const lastSet = prevSets[prevSets.length - 1];
    updated[exerciseIndex].sets.push({ weight: lastSet?.weight || 0, reps: lastSet?.reps || 0, completed: false });
    setExercises(updated);
    updateWorkout(updated);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercises];
    if (updated[exerciseIndex].sets.length <= 1) return;
    updated[exerciseIndex].sets.splice(setIndex, 1);
    setExercises(updated);
    updateWorkout(updated);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: string, value: any) => {
    const updated = [...exercises];
    updated[exerciseIndex].sets[setIndex][field] = value;
    setExercises(updated);
    updateWorkout(updated);
  };

  const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exercises];
    const set = updated[exerciseIndex].sets[setIndex];
    set.completed = !set.completed;
    setExercises(updated);
    updateWorkout(updated);
    if (set.completed) setActiveRest({ seconds: updated[exerciseIndex].restTime || 90 });
  };

  const updateExerciseName = (idx: number, name: string) => {
    const updated = [...exercises];
    updated[idx].name = name;
    setExercises(updated);
    updateWorkout(updated);
  };

  const updateMuscleGroup = (idx: number, group: string) => {
    const updated = [...exercises];
    updated[idx].muscleGroup = group;
    setExercises(updated);
    updateWorkout(updated);
  };

  const updateRestTime = (idx: number, time: number) => {
    const updated = [...exercises];
    updated[idx].restTime = time;
    setExercises(updated);
    updateWorkout(updated);
  };

  const finishWorkout = async () => {
    const durationMinutes = Math.max(1, Math.round((Date.now() - startTime.current) / 60000));
    try {
      await fetch(`/api/workouts/${workout._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'completed', duration: durationMinutes })
      });
      onComplete();
    } catch (err) { console.error('Failed to complete workout', err); }
  };

  const handleSaveRoutine = async () => {
    if (!routineName.trim()) return;
    try {
      await fetch('/api/workouts/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: routineName.trim(),
          split: workout.split,
          exercises: exercises.map(ex => ({
            name: ex.name,
            muscleGroup: ex.muscleGroup,
            restTime: ex.restTime,
            sets: ex.sets.map((s: any) => ({ reps: s.reps, weight: s.weight }))
          }))
        })
      });
      setRoutineSaved(true);
      setShowSaveRoutine(false);
      setRoutineName('');
      setTimeout(() => setRoutineSaved(false), 3000);
    } catch (err) { console.error('Failed to save routine', err); }
  };

  const completedSets = exercises.reduce((acc, ex) => acc + ex.sets.filter((s: any) => s.completed).length, 0);
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <header className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl sticky top-4 z-40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">{workout.name || workout.split} Session</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
              <span className="flex items-center gap-1.5 text-gray-400 text-sm">
                <Clock className="w-4 h-4" />
                {formatElapsed(elapsed)}
              </span>
              <span className="text-sm text-gray-500">{completedSets}/{totalSets} sets done</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {routineSaved && (
              <span className="text-emerald-400 text-sm font-medium">Routine saved!</span>
            )}
            <button
              onClick={() => setShowSaveRoutine(true)}
              className="bg-zinc-800 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-zinc-700 transition-colors hidden sm:block"
            >
              Save Routine
            </button>
            <button
              onClick={() => setShowFinishConfirm(true)}
              className="bg-emerald-500 text-black px-5 py-2 rounded-xl font-bold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 text-sm"
            >
              Finish
            </button>
          </div>
        </div>
      </header>

      {/* Exercise list */}
      <div className="space-y-6">
        {Object.entries(
          exercises.reduce((acc, ex, idx) => {
            const group = ex.muscleGroup || 'Other';
            if (!acc[group]) acc[group] = [];
            acc[group].push({ ...ex, originalIndex: idx });
            return acc;
          }, {} as Record<string, any[]>)
        ).map(([groupName, groupExercises]) => (
          <div key={groupName} className="space-y-4">
            <h2 className="text-base font-bold text-emerald-400 border-b border-zinc-800 pb-2">{groupName}</h2>
            {(groupExercises as any[]).map((exercise: any) => {
              const exIdx = exercise.originalIndex;
              return (
                <div key={exIdx} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-950/50 gap-3">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <input
                        type="text"
                        value={exercise.name}
                        onChange={e => updateExerciseName(exIdx, e.target.value)}
                        className="bg-transparent text-lg font-bold text-white focus:outline-none w-full"
                        placeholder="Exercise Name"
                      />
                      <input
                        type="text"
                        value={exercise.muscleGroup || ''}
                        onChange={e => updateMuscleGroup(exIdx, e.target.value)}
                        className="bg-transparent text-sm text-emerald-400 focus:outline-none w-full"
                        placeholder="Muscle Group"
                      />
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="flex items-center gap-1.5 text-sm text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        <input
                          type="number"
                          value={exercise.restTime}
                          onChange={e => updateRestTime(exIdx, Number(e.target.value))}
                          className="bg-transparent w-10 text-right focus:outline-none text-white"
                        />s
                      </div>
                      <button onClick={() => setViewHistoryFor(exercise.name)} className="p-1.5 text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors" title="View History">
                        <BarChart2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeExercise(exIdx)} className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-900/10 rounded-lg transition-colors" title="Remove Exercise">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-12 gap-3 mb-2 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="col-span-1 text-center">#</div>
                      <div className="col-span-3 text-center">Prev</div>
                      <div className="col-span-3 text-center">kg</div>
                      <div className="col-span-3 text-center">Reps</div>
                      <div className="col-span-2 text-center">✓</div>
                    </div>

                    {exercise.sets.map((set: any, setIdx: number) => {
                      const prevSet = previousPerformances[exercise.name]?.[setIdx];
                      return (
                        <div key={setIdx} className={`grid grid-cols-12 gap-3 items-center p-2 rounded-xl transition-colors ${set.completed ? 'bg-emerald-900/10 border border-emerald-900/30' : 'hover:bg-zinc-800/50'}`}>
                          <div className="col-span-1 text-center font-mono text-gray-400 text-sm">{setIdx + 1}</div>
                          <div className="col-span-3 text-center text-gray-500 text-xs">
                            {prevSet ? `${prevSet.weight}×${prevSet.reps}` : '—'}
                          </div>
                          <div className="col-span-3">
                            <input type="number" value={set.weight || ''} onChange={e => updateSet(exIdx, setIdx, 'weight', Number(e.target.value))}
                              className="w-full bg-black border border-zinc-800 rounded-lg px-2 py-2 text-center text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                              placeholder="0" disabled={set.completed} />
                          </div>
                          <div className="col-span-3">
                            <input type="number" value={set.reps || ''} onChange={e => updateSet(exIdx, setIdx, 'reps', Number(e.target.value))}
                              className="w-full bg-black border border-zinc-800 rounded-lg px-2 py-2 text-center text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                              placeholder="0" disabled={set.completed} />
                          </div>
                          <div className="col-span-2 flex justify-center items-center gap-1">
                            <button onClick={() => toggleSetComplete(exIdx, setIdx)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${set.completed ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 hover:text-white'}`}>
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex gap-2 mt-3">
                      <button onClick={() => addSet(exIdx)}
                        className="flex-1 py-2.5 border border-dashed border-zinc-700 rounded-xl text-gray-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-800/50 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                        <Plus className="w-4 h-4" /> Add Set
                      </button>
                      {exercise.sets.length > 1 && (
                        <button onClick={() => removeSet(exIdx, exercise.sets.length - 1)}
                          className="px-3 py-2.5 border border-dashed border-zinc-700 rounded-xl text-gray-600 hover:text-red-400 hover:border-red-900/50 transition-all text-sm">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <button onClick={addExercise}
          className="w-full py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-white hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 font-medium">
          <Plus className="w-5 h-5" /> Add Exercise
        </button>
      </div>

      {/* Save Routine Modal */}
      {showSaveRoutine && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Save as Routine</h3>
            <input
              type="text"
              value={routineName}
              onChange={e => setRoutineName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveRoutine()}
              autoFocus
              placeholder="e.g. My Push Day"
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowSaveRoutine(false); setRoutineName(''); }}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-gray-400 hover:text-white transition-colors text-sm font-medium">
                Cancel
              </button>
              <button onClick={handleSaveRoutine} disabled={!routineName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors text-sm disabled:opacity-40">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finish Confirmation Modal */}
      {showFinishConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm text-center">
            <h3 className="text-lg font-bold mb-2">Finish workout?</h3>
            <p className="text-gray-400 text-sm mb-6">
              {completedSets}/{totalSets} sets completed · {formatElapsed(elapsed)} elapsed
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowFinishConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-gray-400 hover:text-white transition-colors text-sm font-medium">
                Keep Going
              </button>
              <button onClick={() => { setShowFinishConfirm(false); finishWorkout(); }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-colors text-sm shadow-lg shadow-emerald-500/20">
                Finish
              </button>
            </div>
          </div>
        </div>
      )}

      {activeRest && (
        <RestTimer initialSeconds={activeRest.seconds} onComplete={() => setActiveRest(null)} onClose={() => setActiveRest(null)} />
      )}

      {viewHistoryFor && (
        <ExerciseHistory exerciseName={viewHistoryFor} onClose={() => setViewHistoryFor(null)} />
      )}
    </div>
  );
}
