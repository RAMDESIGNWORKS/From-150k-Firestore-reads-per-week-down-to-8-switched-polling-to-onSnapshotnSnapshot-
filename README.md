# AI Executive Assistant — Board of Directors Stack

**RMcManus Holdings LLC — Production-deployed, built solo**

> Cut Firestore reads from 151K/week to 8 by replacing a polling loop with `onSnapshot`. Zero infrastructure changes — just a listener swap in the local worker.

---

## The Architecture Win

The local worker used to poll Firestore every 4 seconds for new jobs:

```
poll every 4s × 60 × 60 × 24 × 7 = 151,200 reads/week
(43% of the free tier, just to check "anything new?")
```

Switched to `onSnapshot` — Firestore pushes changes to the worker the instant they happen:

```
onSnapshot:
  1 read on connect
  1 read per job dispatched
  ≈ 8 reads/week total
```

The worker (`worker/ops-worker.js`) now uses `firebase-admin` and opens a persistent listener on `ops_jobs` filtered to `ownerId == OWNER_ID` and `status in [queued, approved]`. When the React dashboard approves a command, Firestore pushes it directly to the worker — no polling, no delay.

---

## What This Is

A private AI executive stack that gives me a board of directors I can consult any time:

| Advisor | Domain |
|---------|--------|
| CFO | Finance, cash flow, budgets, projections |
| Tax Strategist | Tax planning, deductions, entity structure, IRS |
| Legal Counsel | Contracts, liability, IP, compliance, employment law |
| COO | Operations, workflows, team, vendors, execution |
| CMO | Marketing, advertising, brand, campaigns |
| CPO | Product, technology, platform, development |

Each advisor has a tuned system prompt. The EA routes your question to the right advisor automatically via keyword scoring, then returns the response with a colored advisor badge.

The local worker extends this into desktop control — the EA can read your file system, scan installed programs, search project files, and execute approved operations directly on the machine. Commands flow through Firestore so the approval step always stays in the web dashboard.

---

## Stack

- **Frontend**: React (CRA) + Firebase Hosting
- **Backend**: Firebase Cloud Functions v2 (Node.js)
- **Database**: Firestore
- **Worker**: Node.js (`firebase-admin`) running locally on Windows
- **Auth**: Firebase Auth (Google sign-in)
- **Browser Companion**: Chrome extension — sends page context to EA for guided walkthroughs

---

## Repo Structure

```
AI-Executive-Assistant/
├── src/
│   ├── App.js                          ← Auth gate
│   ├── components/
│   │   └── ExecutiveAssistant.jsx      ← Main EA chat interface
│   └── prompts/
│       └── executive-assistant.js     ← Advisor system prompts + routing
├── functions/
│   └── index.js                       ← Cloud Functions: eaChat, ops job dispatch
├── worker/
│   ├── ops-worker.js                  ← onSnapshot listener + desktop job executor
│   ├── start-worker.ps1               ← PowerShell launcher
│   ├── worker-config.example.json     ← Config template (copy → worker-config.json)
│   └── package.json                   ← firebase-admin dependency
├── browser-companion/                 ← Chrome extension
├── public/
├── firebase.json
├── firestore.rules
└── .env.example
```

---

## Worker Setup

The worker runs locally on your Windows machine and connects directly to Firestore via a service account key.

### 1. Get a service account key

Firebase Console → Project Settings → Service Accounts → **Generate new private key**

Save as `worker/service-account.json` (already in `.gitignore` — never committed).

### 2. Configure

```bash
cp worker/worker-config.example.json worker/worker-config.json
# Fill in HOST_MONITOR_TOKEN, OWNER_ID, PROJECTS_ROOT, INDEX_URL
```

### 3. Install and run

```bash
cd worker
npm install
.\start-worker.ps1
```

The worker will:
- Connect to Firestore and open an `onSnapshot` listener
- Immediately scan and upload your local project index
- Schedule a weekly program audit (Saturdays at 4 AM)
- Execute approved jobs from the EA dashboard in real time

---

## Full App Setup

### Firebase project

```bash
firebase login
firebase init    # Hosting, Functions, Firestore
```

### Environment variables

```bash
cp .env.example .env
# Fill in your Firebase web app credentials
```

### Firebase secrets

```bash
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set BROWSER_COMPANION_TOKEN
firebase functions:secrets:set HOST_MONITOR_TOKEN
```

### Install and run

```bash
npm install
cd functions && npm install && cd ..
npm start              # local dev
npm run deploy         # build + deploy to Firebase
```

---

## Setup

### 1. Firebase project

Create a new Firebase project (or reuse an existing one under RMCMANUS HOLDINGS LLC).

```
firebase login
firebase init    # select: Hosting, Functions, Firestore
```

### 2. Environment variables

```bash
cp .env.example .env
# Fill in your Firebase web app credentials
```

### 3. Firebase secrets (Cloud Functions)

```bash
firebase functions:secrets:set OPENAI_API_KEY
# Enter your OpenAI API key when prompted

firebase functions:secrets:set BROWSER_COMPANION_TOKEN
# Set a long random token for your browser companion extension

firebase functions:secrets:set HOST_MONITOR_TOKEN
# Set a long random token for local D: drive monitor ingest
```

### 4. Install and run

```bash
npm install
cd functions && npm install && cd ..
npm start              # local dev
npm run deploy         # build + deploy to Firebase
```

---

## Day 1 What's Working

- EA chat interface with full conversation history
- Advisor routing based on keyword scoring (`suggestAttendees()`)
- Colored advisor badges on EA responses
- Session persistence in Firestore (`ea_sessions/{id}/messages/`)
- Firebase Auth login gate
- New session button

## Browser Companion (Guide-Through-Web)

The `browser-companion/` Chrome extension sends current page context to Firebase so EA can guide you through complex flows.

Important security rule:
- Do not give the extension or EA your raw passwords.
- Use your browser password manager and normal sign-in flows.
- Companion captures page context (URL/title/help links/headings), not password values.

### Setup

1. Deploy functions so `browserCompanionIngest` is live.
2. In Chrome, open `chrome://extensions`, enable Developer Mode, click **Load unpacked**, and select `browser-companion/`.
3. Open extension **Settings** and fill:
	- `Endpoint URL`: `https://us-central1-<your-project-id>.cloudfunctions.net/browserCompanionIngest`
	- `Companion Token`: value used in `BROWSER_COMPANION_TOKEN`
	- `Owner ID`: your stable user identifier (recommended: Firebase Auth uid)
4. Open any website and click **Analyze This Page** in the extension popup.
5. EA returns step-by-step guidance based on current page context.

## Local D: Drive Monitoring (Windows)

To allow EA to actively monitor your local D: drive and process activity, run the local monitor companion script.

1. Deploy functions so `hostMonitorIngest` and `getHostMonitorStatus` are live.
2. Set `HOST_MONITOR_TOKEN` via Firebase Secrets.
3. Run:

```powershell
Set-Location "D:\BUSINESS\9 RMCMANUS HOLDINGS LLC\AI-Executive-Assistant"
$endpoint = "https://us-central1-<your-project-id>.cloudfunctions.net/hostMonitorIngest"
$token = "<HOST_MONITOR_TOKEN>"
$owner = "<your firebase auth uid>"

.\local-monitor\monitor-d-drive.ps1 -EndpointUrl $endpoint -MonitorToken $token -OwnerId $owner
```

Detailed instructions: `local-monitor/README.md`.

## Days 2–5 (Queued)

- **Day 2**: Board member system prompts (user to provide) + full routing pipeline
- **Day 3**: Firestore schema for meetings/ and actionItems/
- **Day 4**: EA Dashboard — open items, meeting calendar, advisor status
- **Day 5**: Testing, proactive reminders, polish
