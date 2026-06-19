import React, { useState } from 'react';
import { X, Clock, Flame, BarChart2 } from 'lucide-react';
import ExerciseHistory from './ExerciseHistory';

interface CompletedWorkoutModalProps {
  workout: any;
  onClose: () => void;
}

export default function CompletedWorkoutModal({ workout, onClose }: CompletedWorkoutModalProps) {
  const [viewHistoryFor, setViewHistoryFor] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-2xl my-8 relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="mb-8">
          <h2 className="text-3xl font-bold">{workout.split} Session</h2>
          <p className="text-gray-400 mt-2">
            {new Date(workout.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
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
          </div>
        </div>

        <div className="space-y-8">
          {Object.entries(
            (workout.exercises || []).reduce((acc: any, ex: any) => {
              const group = ex.muscleGroup || 'Other';
              if (!acc[group]) acc[group] = [];
              acc[group].push(ex);
              return acc;
            }, {} as Record<string, any[]>)
          ).map(([groupName, groupExercises]: [string, any]) => (
            <div key={groupName} className="space-y-4">
              <h2 className="text-xl font-bold text-emerald-400 border-b border-zinc-800 pb-2">{groupName}</h2>
              {groupExercises.map((exercise: any, exIdx: number) => (
                <div key={exIdx} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
                    <h3 className="text-xl font-bold text-white">{exercise.name}</h3>
                    <button 
                      onClick={() => setViewHistoryFor(exercise.name)}
                      className="p-2 text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                      title="View History"
                    >
                      <BarChart2 className="w-4 h-4" />
                      History
                    </button>
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-12 gap-4 mb-2 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="col-span-2 text-center">Set</div>
                      <div className="col-span-4 text-center">kg</div>
                      <div className="col-span-4 text-center">Reps</div>
                      <div className="col-span-2 text-center">Status</div>
                    </div>

                    {exercise.sets.map((set: any, setIdx: number) => (
                      <div 
                        key={setIdx} 
                        className="grid grid-cols-12 gap-4 items-center p-2 rounded-xl border-b border-zinc-800/50 last:border-0"
                      >
                        <div className="col-span-2 text-center font-mono text-gray-400">
                          {setIdx + 1}
                        </div>
                        <div className="col-span-4 text-center font-medium text-white">
                          {set.weight || 0}
                        </div>
                        <div className="col-span-4 text-center font-medium text-white">
                          {set.reps || 0}
                        </div>
                        <div className="col-span-2 flex justify-center">
                          {set.completed ? (
                            <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">Done</span>
                          ) : (
                            <span className="text-gray-600 text-xs font-bold uppercase tracking-wider">Skip</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {viewHistoryFor && (
        <ExerciseHistory 
          exerciseName={viewHistoryFor} 
          onClose={() => setViewHistoryFor(null)} 
        />
      )}
    </div>
  );
}
