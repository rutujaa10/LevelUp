import React from 'react';
import { X, Trash2, Droplets } from 'lucide-react';

interface DietDetailsModalProps {
  diet: any;
  onClose: () => void;
  onUpdate: (updatedDiet: any) => void;
  onDelete?: (dietId: string) => void;
  token: string | null;
}

export default function DietDetailsModal({ diet, onClose, onUpdate, onDelete, token }: DietDetailsModalProps) {
  const handleDeleteMeal = async (mealId: string) => {
    try {
      const res = await fetch(`/api/diet/${diet._id}/meals/${mealId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const updatedDiet = await res.json();
        onUpdate(updatedDiet);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateWater = async (amount: number) => {
    try {
      const res = await fetch(`/api/diet/${diet._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ waterIntake: Math.max(0, (diet.waterIntake || 0) + amount) })
      });
      if (res.ok) {
        const updatedDiet = await res.json();
        onUpdate(updatedDiet);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalCalories = diet.meals?.reduce((acc: number, m: any) => acc + (m.calories || 0), 0) || 0;
  const totalProtein = diet.meals?.reduce((acc: number, m: any) => acc + (m.protein || 0), 0) || 0;
  const totalCarbs = diet.meals?.reduce((acc: number, m: any) => acc + (m.carbs || 0), 0) || 0;
  const totalFats = diet.meals?.reduce((acc: number, m: any) => acc + (m.fats || 0), 0) || 0;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              {new Date(diet.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>
            <p className="text-gray-400 mt-1">Daily Summary</p>
          </div>
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                onClick={async () => {
                  if (!confirm('Delete this entire day\'s diet entry?')) return;
                  try {
                    const res = await fetch(`/api/diet/${diet._id}`, {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) { onDelete(diet._id); onClose(); }
                  } catch (err) { console.error(err); }
                }}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-900/10 rounded-lg transition-colors"
                title="Delete day"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-black p-4 rounded-xl text-center border border-zinc-800">
            <p className="text-sm text-gray-400 mb-1">Calories</p>
            <p className="text-xl font-bold text-emerald-400">{totalCalories}</p>
          </div>
          <div className="bg-black p-4 rounded-xl text-center border border-zinc-800">
            <p className="text-sm text-gray-400 mb-1">Protein</p>
            <p className="text-xl font-bold text-blue-400">{totalProtein}g</p>
          </div>
          <div className="bg-black p-4 rounded-xl text-center border border-zinc-800">
            <p className="text-sm text-gray-400 mb-1">Carbs</p>
            <p className="text-xl font-bold text-emerald-400">{totalCarbs}g</p>
          </div>
          <div className="bg-black p-4 rounded-xl text-center border border-zinc-800">
            <p className="text-sm text-gray-400 mb-1">Fats</p>
            <p className="text-xl font-bold text-yellow-400">{totalFats}g</p>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-400" />
              Water Intake
            </h3>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleUpdateWater(-0.5)}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700"
              >-</button>
              <span className="font-bold text-xl">{diet.waterIntake || 0} L</span>
              <button 
                onClick={() => handleUpdateWater(0.5)}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700"
              >+</button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4">Meals</h3>
          {diet.meals?.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No meals logged for this day.</p>
          ) : (
            <div className="space-y-3">
              {diet.meals?.map((meal: any) => (
                <div key={meal._id} className="bg-black border border-zinc-800 p-4 rounded-xl flex items-center justify-between group">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded-full text-gray-300">{meal.time}</span>
                      <h4 className="font-bold">{meal.name}</h4>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-400">
                      <span>{meal.calories} kcal</span>
                      <span>P: {meal.protein}g</span>
                      <span>C: {meal.carbs}g</span>
                      <span>F: {meal.fats}g</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteMeal(meal._id)}
                    className="text-gray-500 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete meal"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
