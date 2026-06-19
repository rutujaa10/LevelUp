<div align="center">

# LevelUp

**A full-stack fitness and wellness tracking application with AI-powered coaching**

*Track workouts, diet, and body measurements — all in one place*

</div>

---

## Features

- **Workout Tracking** — Start sessions from pre-built Push/Pull/Legs templates or create custom routines; track sets, reps, and rest times in real time
- **Workout History** — View completed workouts and per-exercise progress over time
- **Diet Logging** — Log meals with calories, protein, carbs, and fats; track water intake and daily macros
- **Body Measurements** — Record weight, height, waistline, neck, hips, and body fat percentage over time
- **Dashboard** — Visualize weight trends, weekly workout streaks, and goal progress at a glance
- **AI Coach** — Chat with a Google Gemini-powered fitness assistant for personalized advice
- **Authentication** — Secure register/login flow with JWT; sessions last 7 days

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Router 7 |
| Charts | Recharts |
| Animations | Motion |
| Backend | Node.js, Express 4, TypeScript |
| Database | MongoDB via Mongoose (falls back to in-memory DB if no URI set) |
| Auth | JWT + bcryptjs |
| AI | Google Gemini (`gemini-2.0-flash-exp`) via `@google/genai` |

---

## Project Structure

```
levelup/
├── src/                        # React frontend
│   ├── App.tsx                 # Routing
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx       # Stats, weight chart, streak
│   │   ├── Profile.tsx         # Body measurements
│   │   ├── Workouts.tsx        # Workout management & history
│   │   ├── Diet.tsx            # Nutrition tracking
│   │   └── Chatbot.tsx         # AI Coach chat interface
│   ├── components/
│   │   ├── Layout.tsx          # Sidebar + bottom nav (responsive)
│   │   ├── ActiveWorkout.tsx   # Live workout session UI
│   │   ├── RestTimer.tsx       # Rest timer between sets
│   │   ├── CompletedWorkoutModal.tsx
│   │   ├── ExerciseHistory.tsx
│   │   └── DietDetailsModal.tsx
│   └── context/
│       └── AuthContext.tsx     # Global auth state
│
├── server/                     # Express backend
│   ├── models/
│   │   ├── User.ts             # User, measurements, goals
│   │   ├── Workout.ts          # Workout sessions & templates
│   │   └── Diet.ts             # Meals & macros
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── workouts.ts
│   │   └── diet.ts
│   └── middleware/
│       └── auth.ts             # JWT verification
│
└── server.ts                   # Express entry point (serves API + built frontend)
```

---

## Demo Account

A pre-seeded demo account is created automatically on every server start. It contains 90 days of realistic data across every feature so the app looks production-ready the moment you log in.

| Field | Value |
|---|---|
| Email | `demo@levelup.com` |
| Password | `demo123` |

What's pre-populated:

- **Dashboard** — 14-day workout streak, weight progress chart (85 kg → 78 kg over 12 weeks), current weight 78.2 kg, 7+ workouts this week
- **Workouts** — ~68 completed Push/Pull/Legs sessions spanning 90 days with realistic weight progression (Bench: 60 → 80 kg, Deadlift: 80 → 120 kg, Squat: 60 → 100 kg); an active mid-session Push Day workout
- **Diet** — 14 days of meals (breakfast, lunch, dinner, snacks) with ~2,300 kcal/day, ~170 g protein, 3.0–3.5 L water
- **Profile** — 13 weekly measurement snapshots (weight, waist, body fat, height, neck, hips)
- **AI Coach** — pre-loaded conversation history with realistic coaching dialogue
- **Templates** — Push Day, Pull Day, Leg Day all configured

**Extending the demo:** All demo data lives in [server/seed/demoSeed.ts](server/seed/demoSeed.ts). When you add a new feature, add its demo data inside `seedDemoUser()` — that's the only place you need to touch.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Google Gemini API key ([get one here](https://aistudio.google.com/apikey))
- A MongoDB URI (optional — uses in-memory MongoDB if not provided)

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env and fill in the required values (see below)

# 3. Start the dev server (frontend + backend together on port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build   # Compile frontend and server
npm start       # Serve production build on port 3000
```

---

## Environment Variables

Copy `.env.example` to `.env` and set these values:

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for the AI Coach chatbot |
| `JWT_SECRET` | Yes | Secret used to sign JWT tokens (use a long random string in production) |
| `MONGODB_URI` | No | MongoDB connection string — falls back to in-memory DB if omitted |
| `APP_URL` | No | Public URL of the app (default: `http://localhost:3000`) |
| `TWILIO_ACCOUNT_SID` | No | Twilio credentials for optional WhatsApp workout reminders |
| `TWILIO_AUTH_TOKEN` | No | Twilio auth token |
| `TWILIO_WHATSAPP_NUMBER` | No | Twilio WhatsApp sender number |

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Register a new user |
| `POST` | `/login` | Login and receive a JWT |
| `GET` | `/me` | Get the current authenticated user |
| `POST` | `/measurements` | Log a body measurement snapshot |
| `PUT` | `/settings` | Update settings (e.g. weekly workout goal) |

### Workouts — `/api/workouts`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/templates` | Get available workout templates |
| `POST` | `/templates` | Create a custom template |
| `POST` | `/templates/seed` | Reset templates to defaults (Push/Pull/Legs) |
| `POST` | `/` | Start a new workout session |
| `GET` | `/active` | Get the currently active workout |
| `PUT` | `/:id` | Update (or complete) a workout |
| `GET` | `/` | Get completed workout history |
| `GET` | `/history/:exerciseName` | Get history for a specific exercise |

### Diet — `/api/diet`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/` | Log a meal |
| `GET` | `/` | Get diet history (last 14 days) |
| `PUT` | `/:id` | Update a diet entry |
| `DELETE` | `/:id/meals/:mealId` | Delete a specific meal |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build frontend and compile server TypeScript |
| `npm start` | Run the production server |
| `npm run preview` | Preview the production frontend build |
| `npm run lint` | Type-check the codebase |
| `npm run clean` | Remove the `dist/` directory |
