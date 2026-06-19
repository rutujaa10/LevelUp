import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, Bot, User, Loader2, Trash2 } from 'lucide-react';
import Markdown from 'react-markdown';

type Message = { id: string; role: 'user' | 'ai'; content: string };

const DEMO_MESSAGES: Message[] = [
  { id: 'demo-0', role: 'ai',   content: 'Hi Alex! I\'m your LevelUp AI Coach. How can I help you with your fitness journey today?' },
  { id: 'demo-1', role: 'user', content: 'How can I increase my bench press faster? I\'ve been stuck around 80 kg for a bit.' },
  { id: 'demo-2', role: 'ai',   content: `Great question! Here are the most effective strategies to break through a bench press plateau:

**1. Progressive Overload**
Instead of always adding weight, try these variations:
- Add **1 rep per set** each session before bumping the weight
- Use **micro-plates** (0.5–1 kg) for smaller jumps
- Try **paused reps** — 2-second pause at the chest builds raw strength

**2. Strengthen Your Supporting Muscles**
Weak links kill your bench. Focus on:
- **Triceps**: Skull crushers, close-grip bench, dips
- **Front delts**: Overhead press, incline press
- **Upper back**: Rows and face pulls (critical for shoulder stability)

**3. Fix Your Technique**
- Drive your feet into the floor for leg drive
- Keep your shoulder blades retracted and depressed
- Grip the bar hard — full-body tension helps you press more

**4. Programming Tweak**
Try **5×5 at 85% 1RM** for 3 weeks, then deload and retest. Strength adaptations need time.

You're at 80 kg — 100 kg is absolutely achievable within a few months with smart training.

*Disclaimer: I'm not a substitute for professional medical advice. Consult a qualified coach for personalized programming.*` },
  { id: 'demo-3', role: 'user', content: 'What should I eat on workout days vs rest days?' },
  { id: 'demo-4', role: 'ai',   content: `Solid question — nutrient timing around training makes a real difference.

**On Workout Days (like today's Push Day):**

| Timing | What to eat |
|--------|------------|
| 1–2 hrs before | Complex carbs + moderate protein. *Example: oats with banana + whey shake* |
| During | Water + electrolytes if session > 60 min |
| Within 45 min after | Fast protein + carbs. *Example: whey shake + fruit* |

**Target macros (your cut phase):**
- Calories: ~2,300–2,400 kcal
- Protein: **170–180 g** (priority — preserves muscle while cutting)
- Carbs: **220–240 g** (fuel for training)
- Fats: **65–75 g**

**On Rest Days:**
- Drop calories by ~150–200 kcal (less fuel needed)
- Keep protein the same — muscle recovery continues
- Reduce carbs slightly, keep fats the same
- *Example: 2,100–2,200 kcal, same protein target*

**Your current diet looks solid** — the dal + rice + paneer dinner is a great combo of complete protein and slow carbs. Keep the whey shake post-workout on training days.

*Disclaimer: These are general guidelines. A registered dietitian can create a plan tailored to your specific needs.*` },
  { id: 'demo-5', role: 'user', content: 'I just hit 80 kg on bench for 4 sets today. What should my next target be?' },
  { id: 'demo-6', role: 'ai',   content: `That's a genuinely strong milestone — 80 kg × 4 sets is serious work, Alex. Here's your roadmap:

**Immediate next target: 85 kg × 3×5**
- Spend 2–3 weeks consolidating 80 kg (more reps per set: aim for 4×8)
- Then move to 82.5 kg for 4×6, then 85 kg for 3×5

**Medium-term goal: 90 kg × 3×3 (in ~6–8 weeks)**
This is where strength really starts to feel impressive and opens the door to a 100 kg attempt.

**The 100 kg milestone:**
At your current trajectory (roughly +2.5 kg every 2–3 weeks), you're looking at **3–4 months** to a 100 kg bench. That's completely realistic.

**One thing to watch:**
At heavier loads, shoulder health becomes critical. Make sure you're doing:
- Face pulls 3× per week (you already do — keep it up)
- External rotation work
- Never skipping warm-up sets

You're on a great path. The data doesn't lie — your numbers have been climbing consistently. Keep the PPL split, stay in the calorie target, and trust the process.

*Disclaimer: Training advice is not a substitute for professional coaching or medical guidance.*` },
];

export default function Chatbot() {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { id: 'initial', role: 'ai', content: 'Hi! I am your LevelUp AI Coach. How can I help you with your fitness journey today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Populate demo conversation when the demo user is detected
  useEffect(() => {
    if (user?.isDemoUser) {
      setMessages(DEMO_MESSAGES);
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleDelete = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const newMessageId = Date.now().toString();
    setInput('');
    
    // Save current messages to use for history
    const currentMessages = [...messages];
    
    setMessages(prev => [...prev, { id: newMessageId, role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const contents = currentMessages
        .filter(m => !m.id.startsWith('demo-') && m.id !== 'initial')
        .map(m => ({
          role: m.role === 'ai' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));
      contents.push({ role: 'user', parts: [{ text: userMessage }] });

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ contents })
      });

      const data = await res.json();
      const reply = res.ok && data.text
        ? data.text
        : (data.error || 'Sorry, I encountered an error. Please try again later.');

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: reply }]);
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: 'Sorry, I encountered an error. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">AI Coach</h1>
        <p className="text-gray-400 mt-2">Get personalized advice on workouts, diet, and recovery.</p>
      </header>

      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 group ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'bg-blue-600' : 'bg-emerald-600'
              }`}>
                {msg.role === 'user' ? <User className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
              </div>
              <div className={`relative max-w-[80%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-zinc-800 text-gray-200 border border-zinc-700 rounded-tl-none'
              }`}>
                <div className="markdown-body">
                  <Markdown>{msg.content}</Markdown>
                </div>
                <button
                  onClick={() => handleDelete(msg.id)}
                  className={`absolute top-2 ${msg.role === 'user' ? '-left-10' : '-right-10'} p-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity`}
                  title="Delete message"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-tl-none p-4 flex items-center gap-2 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your workout, diet, or recovery..."
              className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-zinc-600 transition-colors"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-white text-black p-3 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="text-xs text-center text-gray-500 mt-3">
            AI Coach is not a substitute for professional medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}
