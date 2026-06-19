import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, MessageSquare, Send, Loader2 } from 'lucide-react';

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${value ? 'bg-emerald-500' : 'bg-zinc-700'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function Profile() {
  const { user, token } = useAuth();
  const [measurements, setMeasurements] = useState({
    weight: '',
    height: '',
    waistline: '',
    neck: '',
    hips: '',
    bodyFat: ''
  });
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // AI Coach state
  const [whatsapp, setWhatsapp] = useState('');
  const [coachingEnabled, setCoachingEnabled] = useState(false);
  const [coachPersonality, setCoachPersonality] = useState('motivational');
  const [morningTime, setMorningTime] = useState('');
  const [eveningTime, setEveningTime] = useState('');
  const [dietRemindersEnabled, setDietRemindersEnabled] = useState(true);
  const [waterRemindersEnabled, setWaterRemindersEnabled] = useState(true);
  const [dailyWaterTarget, setDailyWaterTarget] = useState('4');
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachMessage, setCoachMessage] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data.measurements?.length > 0) {
            const latest = data.measurements[data.measurements.length - 1];
            setMeasurements({
              weight: latest.weight || '',
              height: latest.height || '',
              waistline: latest.waistline || '',
              neck: latest.neck || '',
              hips: latest.hips || '',
              bodyFat: latest.bodyFat || ''
            });
          }
          if (data.age) setAge(String(data.age));
          if (data.gender) setGender(data.gender);

          // Coach fields
          if (data.whatsapp) setWhatsapp(data.whatsapp);
          if (data.coachingEnabled !== undefined) setCoachingEnabled(data.coachingEnabled);
          if (data.coachPersonality) setCoachPersonality(data.coachPersonality);
          if (data.preferredMorningWorkoutTime) setMorningTime(data.preferredMorningWorkoutTime);
          if (data.preferredEveningWorkoutTime) setEveningTime(data.preferredEveningWorkoutTime);
          if (data.dietRemindersEnabled !== undefined) setDietRemindersEnabled(data.dietRemindersEnabled);
          if (data.waterRemindersEnabled !== undefined) setWaterRemindersEnabled(data.waterRemindersEnabled);
          if (data.dailyWaterTarget) setDailyWaterTarget(String(data.dailyWaterTarget));
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMeasurements({ ...measurements, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/auth/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(measurements)
      });
      setMessage(res.ok ? 'Measurements saved!' : 'Failed to save measurements.');
    } catch {
      setMessage('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage('');
    try {
      const res = await fetch('/api/auth/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ age: age ? Number(age) : undefined, gender: gender || undefined })
      });
      setProfileMessage(res.ok ? 'Profile updated!' : 'Failed to update profile.');
    } catch {
      setProfileMessage('Network error.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCoachSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (coachingEnabled && !whatsapp) {
      setCoachMessage('Enter your WhatsApp number to enable coaching.');
      return;
    }
    setCoachLoading(true);
    setCoachMessage('');
    try {
      const res = await fetch('/api/auth/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          whatsapp: whatsapp || '',
          coachingEnabled,
          coachPersonality,
          preferredMorningWorkoutTime: morningTime || '',
          preferredEveningWorkoutTime: eveningTime || '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          dietRemindersEnabled,
          waterRemindersEnabled,
          dailyWaterTarget: Number(dailyWaterTarget) || 4,
        }),
      });
      setCoachMessage(res.ok ? 'Coach settings saved!' : 'Failed to save settings.');
    } catch {
      setCoachMessage('Network error.');
    } finally {
      setCoachLoading(false);
    }
  };

  const handleTestMessage = async () => {
    if (!whatsapp) {
      setCoachMessage('Enter your WhatsApp number first.');
      return;
    }
    setTestLoading(true);
    setCoachMessage('');
    try {
      const res = await fetch('/api/auth/coach/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ whatsapp }),
      });
      const data = await res.json();
      setCoachMessage(res.ok ? 'Test message sent! Check your WhatsApp.' : data.error || 'Failed to send.');
    } catch {
      setCoachMessage('Network error.');
    } finally {
      setTestLoading(false);
    }
  };

  if (fetching) return <div className="text-center py-12 text-gray-500">Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Profile & Measurements</h1>
        <p className="text-gray-400 mt-2">Track your body metrics to visualize your progress.</p>
      </header>

      {/* Personal Info */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
        <h2 className="text-xl font-semibold mb-2">Personal Info</h2>
        <p className="text-sm text-gray-500 mb-6">Used for accurate calorie calculations (Mifflin-St Jeor).</p>

        {profileMessage && (
          <div className={`p-4 rounded-xl mb-6 ${profileMessage.includes('updated') ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-900/50' : 'bg-red-900/20 text-red-400 border border-red-900/50'}`}>
            {profileMessage}
          </div>
        )}

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Age</label>
              <input type="number" min="13" max="100" value={age} onChange={e => setAge(e.target.value)}
                placeholder="e.g. 25"
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors">
                <option value="">Not specified</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={profileLoading}
            className="flex items-center gap-2 bg-zinc-800 text-white font-medium py-2.5 px-5 rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" />
            {profileLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* AI Coach */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-semibold">AI Coach on WhatsApp</h2>
          </div>
          <Toggle value={coachingEnabled} onChange={setCoachingEnabled} />
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Personalized reminders powered by Gemini — based on your real streaks, macros, and progress. Not generic messages.
        </p>

        {coachMessage && (
          <div className={`p-4 rounded-xl mb-6 text-sm ${
            coachMessage.includes('saved') || coachMessage.includes('sent') || coachMessage.includes('Check')
              ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-900/50'
              : 'bg-red-900/20 text-red-400 border border-red-900/50'
          }`}>
            {coachMessage}
          </div>
        )}

        <form onSubmit={handleCoachSave} className="space-y-6">
          {/* WhatsApp number */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">WhatsApp Number</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="+919137670761"
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
            />
            <p className="mt-1.5 text-xs text-gray-500">Include country code. Must be joined to the Twilio WhatsApp sandbox.</p>
          </div>

          {/* Workout times */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">Preferred Workout Times</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Morning</p>
                <input type="time" value={morningTime} onChange={e => setMorningTime(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Evening</p>
                <input type="time" value={eveningTime} onChange={e => setEveningTime(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">If you haven't logged a workout by this time, your coach will send a reminder. Leave blank to skip.</p>
          </div>

          {/* Coach personality */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Coach Personality</label>
            <select value={coachPersonality} onChange={e => setCoachPersonality(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors">
              <option value="motivational">Motivational — fire and focus</option>
              <option value="friendly">Friendly — warm and encouraging</option>
              <option value="strict">Strict — no excuses, accountability</option>
              <option value="funny">Funny — humor-driven motivation</option>
              <option value="competitive">Competitive — beat your own records</option>
            </select>
          </div>

          {/* Daily water target */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Daily Water Target (liters)</label>
            <input
              type="number" step="0.5" min="1" max="8"
              value={dailyWaterTarget}
              onChange={e => setDailyWaterTarget(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
            />
          </div>

          {/* Notification toggles */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-400">Notifications</p>
            <div className="flex items-center justify-between bg-black border border-zinc-800 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm text-white">Diet Reminders</p>
                <p className="text-xs text-gray-500 mt-0.5">Macro & calorie check-ins every ~4 hours</p>
              </div>
              <Toggle value={dietRemindersEnabled} onChange={setDietRemindersEnabled} />
            </div>
            <div className="flex items-center justify-between bg-black border border-zinc-800 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm text-white">Water Reminders</p>
                <p className="text-xs text-gray-500 mt-0.5">Hydration nudges until you hit your target</p>
              </div>
              <Toggle value={waterRemindersEnabled} onChange={setWaterRemindersEnabled} />
            </div>
          </div>

          {/* Max message limits info */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 text-xs text-gray-500 space-y-1">
            <p className="text-gray-400 font-medium text-sm mb-2">Daily message limits</p>
            <p>Workout reminders: max 2/day</p>
            <p>Diet reminders: max 3/day</p>
            <p>Water reminders: max 3/day</p>
            <p className="text-gray-400 font-medium mt-2">Total cap: 6 messages/day — no spam, ever.</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleTestMessage}
              disabled={testLoading}
              className="flex items-center gap-2 bg-zinc-800 text-white font-medium py-2.5 px-5 rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-40"
            >
              {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {testLoading ? 'Sending...' : 'Send Test'}
            </button>
            <button
              type="submit"
              disabled={coachLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-medium py-2.5 px-5 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {coachLoading ? 'Saving...' : 'Save Coach Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Measurements */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
        <h2 className="text-xl font-semibold mb-6">Log New Measurements</h2>

        {message && (
          <div className={`p-4 rounded-xl mb-6 ${message.includes('saved') ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-900/50' : 'bg-red-900/20 text-red-400 border border-red-900/50'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Weight (kg)</label>
              <input type="number" step="0.1" name="weight" value={measurements.weight} onChange={handleChange}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                placeholder="e.g. 75.5" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Height (cm)</label>
              <input type="number" name="height" value={measurements.height} onChange={handleChange}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                placeholder="e.g. 175" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Waistline (cm)</label>
              <input type="number" step="0.1" name="waistline" value={measurements.waistline} onChange={handleChange}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Body Fat (%)</label>
              <input type="number" step="0.1" name="bodyFat" value={measurements.bodyFat} onChange={handleChange}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-white text-black font-medium py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50">
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : 'Save Measurements'}
          </button>
        </form>
      </div>
    </div>
  );
}
