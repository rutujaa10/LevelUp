import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Utensils, Droplets, Flame, X, Target, ArrowDown, ArrowUp, Info, ChevronDown, ChevronUp } from 'lucide-react';
import DietDetailsModal from '../components/DietDetailsModal';

export default function Diet() {
  const { token } = useAuth();
  const [diets, setDiets] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<{ age?: number; gender?: string }>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [waterLoading, setWaterLoading] = useState(false);
  const [selectedDiet, setSelectedDiet] = useState<any>(null);
  const [calorieMode, setCalorieMode] = useState<'maintenance' | 'cut' | 'bulk'>('maintenance');
  const [showCalorieOptions, setShowCalorieOptions] = useState(false);
  const [showCalculationInfo, setShowCalculationInfo] = useState(false);
  const [formData, setFormData] = useState({
    mealName: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    time: 'Breakfast'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dietRes, userRes] = await Promise.all([
          fetch('/api/diet', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        if (dietRes.ok) {
          const contentType = dietRes.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await dietRes.json();
            setDiets(data);
          }
        }
        if (userRes.ok) {
          const contentType = userRes.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const userData = await userRes.json();
            setMeasurements(userData.measurements || []);
            setUserProfile({ age: userData.age, gender: userData.gender });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleAddWater = async (amount: number) => {
    setWaterLoading(true);
    const newAmount = parseFloat(((consumedWater || 0) + amount).toFixed(2));
    try {
      const res = await fetch('/api/diet/water', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ waterIntake: newAmount }),
      });
      if (res.ok) {
        const data = await res.json();
        setDiets(prev => {
          const idx = prev.findIndex(d => d._id === data._id);
          if (idx >= 0) { const n = [...prev]; n[idx] = data; return n; }
          return [data, ...prev];
        });
      }
    } catch (err) {
      console.error('Failed to update water:', err);
    } finally {
      setWaterLoading(false);
    }
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/diet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          meals: [{
            name: formData.mealName,
            calories: Number(formData.calories),
            protein: Number(formData.protein),
            carbs: Number(formData.carbs),
            fats: Number(formData.fats),
            time: formData.time
          }]
        })
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await res.json();
          setDiets(prev => {
            const existingIdx = prev.findIndex(d => d._id === data._id);
            if (existingIdx >= 0) {
              const newDiets = [...prev];
              newDiets[existingIdx] = data;
              return newDiets;
            }
            return [data, ...prev];
          });
          setShowModal(false);
          setFormData({ mealName: '', calories: '', protein: '', carbs: '', fats: '', time: 'Breakfast' });
        }
      } else {
        console.error("Failed to add meal:", await res.text());
      }
    } catch (err) {
      console.error("Error adding meal:", err);
    }
  };

  const latestMeasurement = measurements.length > 0 ? measurements[measurements.length - 1] : null;
  const latestWeight = latestMeasurement?.weight || 0;
  const latestHeight = latestMeasurement?.height || 0;

  // Mifflin-St Jeor BMR when age/gender/height available, fallback to simple formula
  const computeMaintenance = (): number => {
    if (!latestWeight) return 0;
    const { age, gender } = userProfile;
    if (age && gender && latestHeight) {
      const bmr = gender === 'female'
        ? (10 * latestWeight) + (6.25 * latestHeight) - (5 * age) - 161
        : (10 * latestWeight) + (6.25 * latestHeight) - (5 * age) + 5;
      return Math.round(bmr * 1.55);
    }
    return Math.round(latestWeight * 24 * 1.55);
  };

  const maintenanceCalories = computeMaintenance();
  const cutCalories = maintenanceCalories > 0 ? maintenanceCalories - 500 : 0;
  const bulkCalories = maintenanceCalories > 0 ? maintenanceCalories + 500 : 0;
  
  const targetCalories = 
    calorieMode === 'cut' ? cutCalories : 
    calorieMode === 'bulk' ? bulkCalories : 
    maintenanceCalories;

  const targetProtein = latestWeight > 0 ? Math.round(latestWeight * 2) : 0;
  const targetFats = latestWeight > 0 ? Math.round(latestWeight * 1) : 0;
  const targetCarbs = targetCalories > 0 ? Math.round((targetCalories - (targetProtein * 4) - (targetFats * 9)) / 4) : 0;
  const targetWater = latestWeight > 0 ? (latestWeight * 0.035).toFixed(1) : '0.0';

  // Current consumed
  const todayDiet = diets.length > 0 && new Date(diets[0].date).toDateString() === new Date().toDateString() ? diets[0] : null;
  const consumedCalories = todayDiet?.meals?.reduce((acc: number, m: any) => acc + (m.calories || 0), 0) || 0;
  const consumedProtein = todayDiet?.meals?.reduce((acc: number, m: any) => acc + (m.protein || 0), 0) || 0;
  const consumedCarbs = todayDiet?.meals?.reduce((acc: number, m: any) => acc + (m.carbs || 0), 0) || 0;
  const consumedFats = todayDiet?.meals?.reduce((acc: number, m: any) => acc + (m.fats || 0), 0) || 0;
  const consumedWater = todayDiet?.waterIntake || 0;

  const getPercentage = (consumed: number, target: number) => target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 14);

  const thisWeekDiets = diets.filter(d => new Date(d.date) >= sevenDaysAgo);
  const lastWeekDiets = diets.filter(d => new Date(d.date) >= fourteenDaysAgo && new Date(d.date) < sevenDaysAgo);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diet & Nutrition</h1>
          <p className="text-gray-400 mt-2">Fuel your body for optimal performance.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-medium hover:bg-gray-200 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Log Meal</span>
        </button>
      </header>

      {latestWeight === 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl text-yellow-500 text-sm flex items-center gap-3">
          <Info className="w-5 h-5 flex-shrink-0" />
          <p>Please log your body weight in the Profile section to get personalized calorie, macro, and water targets.</p>
        </div>
      )}

      {/* Daily Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl col-span-1 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Today's Macros</h3>
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Protein</span>
                <span className="font-medium">{consumedProtein}g / {targetProtein}g</span>
              </div>
              <div className="w-full bg-black rounded-full h-2 border border-zinc-800">
                <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${getPercentage(consumedProtein, targetProtein)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Carbs</span>
                <span className="font-medium">{consumedCarbs}g / {targetCarbs}g</span>
              </div>
              <div className="w-full bg-black rounded-full h-2 border border-zinc-800">
                <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${getPercentage(consumedCarbs, targetCarbs)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Fats</span>
                <span className="font-medium">{consumedFats}g / {targetFats}g</span>
              </div>
              <div className="w-full bg-black rounded-full h-2 border border-zinc-800">
                <div className="bg-yellow-500 h-2 rounded-full transition-all" style={{ width: `${getPercentage(consumedFats, targetFats)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-center items-center text-center">
          <Droplets className="w-8 h-8 text-blue-400 mb-3" />
          <h3 className="text-gray-400 font-medium mb-1">Water Intake</h3>
          <p className="text-3xl font-bold">{consumedWater.toFixed(1)} L</p>
          <p className="text-sm text-gray-500 mt-1">Goal: {targetWater} L</p>
          <div className="w-full bg-black rounded-full h-1.5 border border-zinc-800 mt-3">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, (consumedWater / parseFloat(targetWater || '1')) * 100)}%` }}
            />
          </div>
          <div className="flex gap-2 mt-4">
            {[0.25, 0.5, 1].map(amt => (
              <button
                key={amt}
                onClick={() => handleAddWater(amt)}
                disabled={waterLoading}
                className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-lg text-blue-400 font-medium transition-colors disabled:opacity-40"
              >
                +{amt < 1 ? `${amt * 1000}ml` : `${amt}L`}
              </button>
            ))}
          </div>
        </div>

        <div 
          onClick={() => setShowCalorieOptions(!showCalorieOptions)}
          className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-center items-center text-center cursor-pointer hover:border-zinc-700 transition-colors relative"
        >
          <Utensils className="w-8 h-8 text-emerald-400 mb-3" />
          <h3 className="text-gray-400 font-medium mb-1">Calories</h3>
          <p className="text-3xl font-bold">{consumedCalories}</p>
          <p className="text-sm text-gray-500 mt-2">
            Goal: {targetCalories} kcal 
            <span className="ml-1 text-xs px-2 py-0.5 bg-zinc-800 rounded-full capitalize">{calorieMode}</span>
          </p>

          {showCalorieOptions && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-xl p-2 z-10 shadow-xl flex flex-col gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setCalorieMode('maintenance'); setShowCalorieOptions(false); }}
                className={`flex items-center justify-between p-2 rounded-lg text-sm ${calorieMode === 'maintenance' ? 'bg-zinc-800 text-white' : 'text-gray-400 hover:bg-zinc-900 hover:text-white'}`}
              >
                <span className="flex items-center gap-2"><Target className="w-4 h-4" /> Balance</span>
                <span>{maintenanceCalories} kcal</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setCalorieMode('cut'); setShowCalorieOptions(false); }}
                className={`flex items-center justify-between p-2 rounded-lg text-sm ${calorieMode === 'cut' ? 'bg-zinc-800 text-white' : 'text-gray-400 hover:bg-zinc-900 hover:text-white'}`}
              >
                <span className="flex items-center gap-2"><ArrowDown className="w-4 h-4 text-blue-400" /> Cut</span>
                <span>{cutCalories} kcal</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setCalorieMode('bulk'); setShowCalorieOptions(false); }}
                className={`flex items-center justify-between p-2 rounded-lg text-sm ${calorieMode === 'bulk' ? 'bg-zinc-800 text-white' : 'text-gray-400 hover:bg-zinc-900 hover:text-white'}`}
              >
                <span className="flex items-center gap-2"><ArrowUp className="w-4 h-4 text-orange-400" /> Bulk</span>
                <span>{bulkCalories} kcal</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Calculation Info */}
      {latestWeight > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <button 
            onClick={() => setShowCalculationInfo(!showCalculationInfo)}
            className="w-full p-6 flex items-center justify-between text-left hover:bg-zinc-800/50 transition-colors"
          >
            <h4 className="text-white font-bold flex items-center gap-2 text-base">
              <Info className="w-5 h-5 text-blue-400" />
              How your targets are calculated
            </h4>
            {showCalculationInfo ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {showCalculationInfo && (
            <div className="px-6 pb-6 text-sm text-gray-400">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-zinc-800">
                <p><strong className="text-gray-300 block mb-1">Maintenance Calories</strong>
                  {userProfile.age && userProfile.gender && latestHeight
                    ? `Calculated using the Mifflin-St Jeor formula (weight ${latestWeight}kg × height ${latestHeight}cm × age ${userProfile.age}) × 1.55 activity multiplier.`
                    : `Estimated using weight (${latestWeight}kg) × 24 × 1.55. Add your age, gender, and height in Profile for a more accurate Mifflin-St Jeor calculation.`
                  }
                </p>
                <p><strong className="text-gray-300 block mb-1">Cut / Bulk Calories</strong> Subtracts or adds 500 calories from your maintenance to ensure a safe and steady weight loss or gain of about 0.5kg per week.</p>
                <p><strong className="text-gray-300 block mb-1">Protein (2g per kg)</strong> Optimal amount to support muscle repair, recovery, and growth after workouts.</p>
                <p><strong className="text-gray-300 block mb-1">Fats (1g per kg)</strong> Essential for hormone regulation, joint health, and overall bodily functions.</p>
                <p><strong className="text-gray-300 block mb-1">Carbs (Remaining Calories)</strong> The remaining calories after protein and fats are calculated, divided by 4 (since 1g carb = 4 kcal), to provide energy for your workouts.</p>
                <p><strong className="text-gray-300 block mb-1">Water (35ml per kg)</strong> A standard baseline for hydration to maintain performance and recovery.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading diet history...</div>
      ) : diets.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-2xl text-center">
          <Utensils className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No meals logged</h3>
          <p className="text-gray-400 mb-6">Start tracking your nutrition to reach your goals.</p>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Log First Meal
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {thisWeekDiets.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-4">This Week</h3>
              {thisWeekDiets.map((diet) => (
                <div 
                  key={diet._id} 
                  onClick={() => setSelectedDiet(diet)}
                  className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold">
                        {new Date(diet.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {diet.meals?.length || 0} meals logged
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{diet.meals?.reduce((acc: number, m: any) => acc + (m.calories || 0), 0)} kcal</p>
                      <p className="text-sm text-gray-400 mt-1">{diet.waterIntake || 0}L water</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {lastWeekDiets.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-4">Last Week</h3>
              {lastWeekDiets.map((diet) => (
                <div 
                  key={diet._id} 
                  onClick={() => setSelectedDiet(diet)}
                  className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-700 transition-colors cursor-pointer opacity-80"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold">
                        {new Date(diet.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {diet.meals?.length || 0} meals logged
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{diet.meals?.reduce((acc: number, m: any) => acc + (m.calories || 0), 0)} kcal</p>
                      <p className="text-sm text-gray-400 mt-1">{diet.waterIntake || 0}L water</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Diet Details Modal */}
      {selectedDiet && (
        <DietDetailsModal
          diet={selectedDiet}
          onClose={() => setSelectedDiet(null)}
          token={token}
          onUpdate={(updatedDiet) => {
            setDiets(prev => {
              const existingIdx = prev.findIndex(d => d._id === updatedDiet._id);
              if (existingIdx >= 0) {
                const newDiets = [...prev];
                newDiets[existingIdx] = updatedDiet;
                return newDiets;
              }
              return prev;
            });
            setSelectedDiet(updatedDiet);
          }}
          onDelete={(dietId) => {
            setDiets(prev => prev.filter(d => d._id !== dietId));
            setSelectedDiet(null);
          }}
        />
      )}

      {/* Add Meal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Log Meal</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddMeal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Meal Time</label>
                <select 
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-white"
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Meal Name</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={formData.mealName}
                    onChange={(e) => setFormData({...formData, mealName: e.target.value})}
                    className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-white"
                    placeholder="e.g. Chicken Salad"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Calories</label>
                  <input 
                    type="number" 
                    value={formData.calories}
                    onChange={(e) => setFormData({...formData, calories: e.target.value})}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-white"
                    placeholder="kcal"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Protein (g)</label>
                  <input 
                    type="number" 
                    value={formData.protein}
                    onChange={(e) => setFormData({...formData, protein: e.target.value})}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-white"
                    placeholder="g"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Carbs (g)</label>
                  <input 
                    type="number" 
                    value={formData.carbs}
                    onChange={(e) => setFormData({...formData, carbs: e.target.value})}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-white"
                    placeholder="g"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Fats (g)</label>
                  <input 
                    type="number" 
                    value={formData.fats}
                    onChange={(e) => setFormData({...formData, fats: e.target.value})}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-white"
                    placeholder="g"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-white text-black font-medium py-3 rounded-xl hover:bg-gray-200 transition-colors mt-6"
              >
                Save Meal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
