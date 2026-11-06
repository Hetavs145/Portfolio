// Architecture diagrams for the smaller projects, which have no architecture
// doc of their own. Each one is derived from the project's repository code —
// `basis` lists the repo files it was read from. Keys match the titles in
// ./projects.js exactly. Merged into ./architectures.js.

export const derived = {
  'YouTube Upload Automation': {
    source: 'Derived from repo code',
    basis: [
      'workflow/youtube-renderer.workflow.json',
      'data/categories.json',
      'docker-compose.yml',
      'Dockerfile',
      'scripts/fetch-images.sh',
      'scripts/narrate.sh',
      'scripts/assemble.sh',
    ],
    layers: [
      {
        label: 'TRIGGER',
        nodes: [
          { name: 'Daily 09:00', note: 'n8n schedule · self-hosted Docker' },
          { name: 'Pick Category', note: 'weekday rotation · categories.json' },
        ],
        edge: 'category prompt',
      },
      {
        label: 'IDEATION',
        nodes: [
          { name: 'Generate Idea', note: 'OpenRouter chat · free model' },
          { name: 'Embed Idea', note: 'OpenRouter embeddings' },
          { name: 'Dedupe Check', note: 'cosine > 0.85 → regen (max 3)' },
        ],
        edge: 'novel idea',
      },
      {
        label: 'SCRIPT',
        nodes: [
          { name: 'Write Script', note: 'narration lines + scene prompts' },
          { name: 'Generate Metadata', note: 'LLM title · description · tags' },
        ],
        edge: 'job dir + prompts',
      },
      {
        label: 'RENDER',
        nodes: [
          { name: 'Pollinations', note: 'flux stills + thumbnail, retries' },
          { name: 'Piper TTS', note: 'narration.wav + timed SRT' },
          { name: 'FFmpeg Assemble', note: 'Ken Burns · captions · 1080×1920' },
        ],
        edge: 'final.mp4 + metadata',
      },
      {
        label: 'PUBLISH',
        nodes: [
          { name: 'YouTube Upload', note: 'Data API v3 · private by default' },
          { name: 'Record Idea', note: 'embedding → ideas.json' },
        ],
      },
    ],
  },

  'Treat-o-Meter': {
    source: 'Derived from repo code',
    basis: [
      'src/App.jsx',
      'src/components/AuthWrapper.jsx',
      'src/utils/storage.js',
      'src/utils/cloudSync.js',
      'src/pages/History.jsx',
      'firestore.rules',
      'package.json',
    ],
    layers: [
      {
        label: 'AUTH',
        nodes: [{ name: 'Firebase Auth', note: 'Google sign-in popup' }],
        edge: 'uid',
      },
      {
        label: 'UI',
        nodes: [
          { name: 'Tasks', note: 'timed + split reward/punishment' },
          { name: 'Permanent Habits', note: '5-day streak tracker' },
          { name: 'History', note: 'transaction ledger + balance' },
          { name: 'PDF Export', note: 'html-to-image + jsPDF' },
        ],
        edge: 'transactions · tasks',
      },
      {
        label: 'LOCAL',
        nodes: [{ name: 'localStorage', note: 'instant offline-first cache' }],
        edge: 'debounced push (1s)',
      },
      {
        label: 'CLOUD',
        nodes: [
          { name: 'Cloud Firestore', note: 'users/{uid}/appData/main' },
          { name: 'Security Rules', note: 'owner-only · newest write wins' },
        ],
      },
    ],
  },

  'Sign2Text': {
    source: 'Derived from repo code',
    basis: [
      'app/live_inference.py',
      'utils/hand_detection.py',
      'utils/model.py',
      'utils/text_processor.py',
      'models/export_onnx.py',
      'web/src/lib/handDetector.js',
      'web/src/lib/aslModel.js',
      'web/src/lib/textProcessor.js',
    ],
    layers: [
      {
        label: 'INPUT',
        nodes: [{ name: 'Webcam', note: 'OpenCV (Python) / browser video' }],
        edge: 'frames',
      },
      {
        label: 'DETECTION',
        nodes: [
          { name: 'MediaPipe Hands', note: 'landmarks → bbox, 20% padding' },
          { name: 'Crop & Normalize', note: '64×64 RGB · ImageNet mean/std' },
        ],
        edge: 'hand image tensor',
      },
      {
        label: 'MODEL',
        nodes: [
          { name: 'MobileNetV2 CNN', note: 'PyTorch transfer learning · 29 cls' },
          { name: 'ONNX Runtime Web', note: 'same model in-browser (WASM)' },
        ],
        edge: 'letter + confidence',
      },
      {
        label: 'OUTPUT',
        nodes: [
          { name: 'Text Buffer', note: 'conf ≥ 0.7 · 1s hold to commit' },
          { name: 'Text-to-Speech', note: 'pyttsx3 (optional)' },
        ],
      },
    ],
  },

  'Hetchat': {
    source: 'Derived from repo code',
    basis: [
      'server/index.js',
      'server/firebaseAuth.js',
      'client/src/context/SocketContext.jsx',
      'client/src/context/AuthContext.jsx',
      'client/src/components/Chat/MessageInput.jsx',
      'client/src/components/Chat/ChatWindow.jsx',
      'firestore.rules',
    ],
    layers: [
      {
        label: 'CLIENT',
        nodes: [
          { name: 'React + Vite', note: 'Tailwind · Framer Motion' },
          { name: 'Firebase Auth', note: 'email/password + Google' },
        ],
        edge: 'message + id token',
      },
      {
        label: 'TRANSPORT',
        parallel: true,
        nodes: [
          { name: 'Socket.IO Relay', note: 'Express · JWT-verified · rate-ltd' },
          { name: 'Firestore Write', note: 'rooms / groups → messages' },
        ],
        edge: 'socket event · snapshot',
      },
      {
        label: 'DELIVERY',
        nodes: [
          { name: 'Room Members', note: 'live messages, typing, join/leave' },
          { name: 'Presence', note: 'users.status + lastSeen' },
        ],
      },
    ],
  },

  'Drone Path-Finder': {
    source: 'Derived from repo code',
    basis: [
      'frontend/src/App.jsx',
      'backend/src/server.js',
      'backend/src/routes/flight.js',
      'backend/src/algorithms/pathfinding.js',
      'backend/package.json',
    ],
    layers: [
      {
        label: 'UI',
        nodes: [{ name: 'React Dashboard', note: 'hub, target, no-fly zones' }],
        edge: 'post /api/flight/plan',
      },
      {
        label: 'API',
        nodes: [{ name: 'Express API', note: 'Node · helmet · rate-limit' }],
        edge: 'start · goal · obstacles',
      },
      {
        label: 'PLANNING',
        parallel: true,
        nodes: [
          { name: 'A* Search', note: 'Haversine heuristic' },
          { name: 'Dijkstra', note: 'priority-queue baseline' },
        ],
        edge: 'waypoints + metrics',
      },
      {
        label: 'VISUALIZE',
        nodes: [
          { name: 'Canvas HUD', note: 'drone flies projected waypoints' },
          { name: 'Telemetry', note: 'battery from route energy (Wh)' },
          { name: 'Algo Comparison', note: 'distance · nodes · compute ms' },
        ],
      },
    ],
  },

  'Spam Detector': {
    source: 'Derived from repo code',
    basis: [
      'app.py',
      'train_models.py',
      'ml-frontend/src/services/api.js',
      'ml-frontend/src/pages/MainPage.jsx',
      'requirements.txt',
    ],
    layers: [
      {
        label: 'CLIENT',
        nodes: [{ name: 'React UI', note: 'Vite · Tailwind · model picker' }],
        edge: 'post /api/predict',
      },
      {
        label: 'PREPROCESS',
        nodes: [
          { name: 'Flask API', note: 'loads pickled models' },
          { name: 'NLTK Cleaning', note: 'stopwords + Porter stemming' },
        ],
        edge: 'stemmed text',
      },
      {
        label: 'FEATURES',
        nodes: [
          { name: 'CountVectorizer', note: 'bag of words · 10k features' },
          { name: 'TF-IDF Transform', note: 'TfidfTransformer' },
        ],
        edge: 'tf-idf vector',
      },
      {
        label: 'MODELS',
        nodes: [
          { name: 'Decision Tree', note: 'entropy · max depth 20' },
          { name: 'Linear SVM', note: 'LinearSVC' },
          { name: 'Multinomial NB', note: 'scikit-learn' },
        ],
        edge: 'label + confidence',
      },
      {
        label: 'OUTPUT',
        nodes: [{ name: 'Result Card', note: 'spam / ham · probabilities' }],
      },
    ],
  },

  'Phishing Detector': {
    source: 'Derived from repo code',
    basis: [
      'backend/app.py',
      'backend/features.py',
      'backend/train_model.py',
      'frontend/src/components/URLChecker.jsx',
      'frontend/src/App.jsx',
    ],
    layers: [
      {
        label: 'CLIENT',
        nodes: [
          { name: 'React + Vite', note: 'Tailwind · Framer Motion' },
          { name: 'Firebase Auth', note: 'email + Google · private routes' },
        ],
        edge: 'post /predict {url}',
      },
      {
        label: 'FEATURES',
        nodes: [
          { name: 'Flask API', note: 'Flask-CORS · gunicorn' },
          { name: 'URL Features', note: '18 lexical: length, dots, IP…' },
        ],
        edge: 'feature vector',
      },
      {
        label: 'MODEL',
        nodes: [{ name: 'Decision Tree', note: 'entropy · depth 25 · ~500k URLs' }],
        edge: 'predict_proba',
      },
      {
        label: 'OUTPUT',
        nodes: [{ name: 'Verdict', note: 'phishing / safe + confidence' }],
      },
    ],
  },

  'Kernel Scribe': {
    source: 'Derived from repo code',
    basis: ['microkernel_simulator.py', 'scheduler.py', 'memory.py', 'README.md'],
    layers: [
      {
        label: 'GUI',
        nodes: [{ name: 'Tkinter GUI', note: '6 tabs · step / auto-run' }],
        edge: 'create · kill · send msg',
      },
      {
        label: 'KERNEL',
        nodes: [{ name: 'Microkernel', note: 'clock-tick loop · observers' }],
        edge: 'per-tick calls',
      },
      {
        label: 'SUBSYSTEMS',
        nodes: [
          { name: 'Scheduler', note: 'Round Robin · Priority · FCFS' },
          { name: 'Memory Manager', note: 'first-fit · 1024 MB · coalesce' },
          { name: 'IPC Manager', note: 'process message queue' },
        ],
        edge: 'state change events',
      },
      {
        label: 'VIEWS',
        nodes: [
          { name: 'Matplotlib Charts', note: 'embedded via FigureCanvasTkAgg' },
          { name: 'Tables + Log', note: 'processes, memory map, IPC' },
        ],
      },
    ],
  },

  'Harzino Blog': {
    source: 'Derived from repo code',
    basis: [
      'src/App.tsx',
      'src/components/BlogData.tsx',
      'src/components/pages/BlogsPage.tsx',
      'src/components/FloatingBlogImages.tsx',
      'package.json',
    ],
    layers: [
      {
        label: 'UI',
        nodes: [
          { name: 'React SPA', note: 'Vite · Figma Make export' },
          { name: 'Search + Filters', note: 'query and category' },
        ],
        edge: 'search / category',
      },
      {
        label: 'DATA',
        nodes: [{ name: 'BlogData.tsx', note: '8 hard-coded posts · no backend' }],
        edge: 'filtered posts',
      },
      {
        label: 'MOTION',
        nodes: [
          { name: 'Motion', note: 'AnimatePresence page transitions' },
          { name: 'Cards + Modal', note: 'floating cards · Unsplash images' },
        ],
      },
    ],
  },
};

export default derived;
