# AskAide AI — Getting Started

This guide walks you through setting up the full AskAide AI stack locally: a React frontend, an Express.js backend, and a FastAPI AI service, backed by MongoDB, Qdrant, and Redis.

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Install Infrastructure Services](#2-install-infrastructure-services)
3. [Clone & Set Up the Backend](#3-clone--set-up-the-backend)
4. [Clone & Set Up the AI Service](#4-clone--set-up-the-ai-service)
5. [Clone & Set Up the Frontend](#5-clone--set-up-the-frontend)
6. [Environment Variable Reference](#6-environment-variable-reference)
7. [Running All Services Together](#7-running-all-services-together)
8. [Verifying the Setup Works](#8-verifying-the-setup-works)
9. [Common Issues & Fixes](#9-common-issues--fixes)
10. [IDE / Editor Recommendations](#10-ide--editor-recommendations)

---

## 1. System Requirements

| Requirement | Minimum Version | Purpose |
|---|---|---|
| **Node.js** | 18+ (LTS recommended) | Frontend & Backend |
| **npm** | 9+ | Package management |
| **Python** | 3.10+ | AI Service |
| **pip** | 22+ | Python packages |
| **MongoDB** | 6.0+ | Primary database |
| **Qdrant** | 1.7+ | Vector database for RAG |
| **Redis** | 7.0+ | Caching / pub-sub |

Optional but useful:

- **nodemon** — installed per-project, not globally required
- **Docker / Docker Compose** — easiest way to run MongoDB, Qdrant, and Redis

Check your versions:

```bash
node --version      # should be v18+
python3 --version   # should be 3.10+
mongod --version    # should be 6.0+
redis-cli --version # should be 7.0+
```

---

## 2. Install Infrastructure Services

### Option A — Docker Compose (recommended)

Create a `docker-compose.yml` at the project root:

```yaml
version: "3.9"
services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mongo_data:
  qdrant_data:
  redis_data:
```

Start everything:

```bash
docker compose up -d
```

### Option B — Install individually

**MongoDB** — https://www.mongodb.com/docs/manual/installation/

**Qdrant** — https://qdrant.tech/documentation/guides/installation/

```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant:latest
```

**Redis** — https://redis.io/docs/getting-started/installation/

```bash
# macOS (Homebrew)
brew install redis && brew services start redis

# Ubuntu / Debian
sudo apt install redis-server && sudo systemctl start redis
```

Verify all three are running:

```bash
# MongoDB
mongosh --eval "db.runCommand({ ping: 1 })"

# Qdrant
curl http://localhost:6333/healthz

# Redis
redis-cli ping    # should return PONG
```

---

## 3. Clone & Set Up the Backend

```bash
cd /path/to/AskAideAI
cd Backend
npm install
```

Create `Backend/.env`:

```env
PORT=4000
NODE_ENV=development

# MongoDB
DATABASE_URL=mongodb://admin:password@localhost:27017/askaideai?authSource=admin

# JWT
JWT_SECRET=your-secure-random-string-here

# AI Service (proxied calls)
AI_ENDPOINT=http://localhost:8000
AI_QUESTION_REQ_URL=http://localhost:8000/generate-questions

# Redis
REDIS_URL=redis://localhost:6379

# Cloudinary (file uploads)
CLOUD_NAME=your_cloud_name
API_KEY=your_api_key
API_SECRET=your_api_secret

# Email
MAIL_HOST=smtp.gmail.com
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password

# Razorpay (payments)
RAZORPAY_KEY=your_razorpay_key
RAZORPAY_SECRET=your_razorpay_secret
```

Start the backend:

```bash
npm run dev
```

The server starts on **http://localhost:4000**. The Swagger docs are available at `http://localhost:4000/api-docs`.

---

## 4. Clone & Set Up the AI Service

```bash
cd /path/to/AskAideAI
cd ai-service

# Create a virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate        # Linux / macOS
# venv\Scripts\activate         # Windows

pip install -r requirements.txt
```

Create `ai-service/.env`:

```env
# --- LLM Provider ---
# Choose one: openrouter, openai, gemini, anthropic
LLM_PROVIDER=openrouter

# --- Embedding ---
# Comma-separated fallback chain. Options: ollama, external, openai, google
EMBEDDING_PROVIDERS=ollama
EMBEDDING_PROVIDER=ollama
QDRANT_VECTOR_SIZE=1024

# --- Qdrant ---
QDRANT_HOST=http://localhost
QDRANT_PORT=6333
QDRANT_API_KEY=
QDRANT_COLLECTION_NAME=ai-service
QDRANT_CHUNK_SIZE=150
QDRANT_CHUNK_OVERLAP=25
QDRANT_MODEL_NAME=all-MiniLM-L6-v2

# --- MongoDB ---
MONGO_URI=mongodb://admin:password@localhost:27017
MONGO_DB_NAME=askaideai
MONGO_TOPIC_COLLECTION=chaptertopics

# --- Redis ---
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USER=default
REDIS_PASSWORD=
REDIS_CHANNEL=ai-service

# --- LLM API Keys (set the one matching LLM_PROVIDER) ---
OPENAI_API_KEY=
OPENROUTER_API_KEY=
OPENROUTER_URL=https://openrouter.ai/api/v1/chat/completions
GEMINI_API_KEY=
ANTHROPIC_API_KEY=

# --- Ollama (if using local embeddings) ---
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=bge-m3

# --- Self URL (for callbacks) ---
SELF_API_URL=http://localhost:8000
```

Start the AI service:

```bash
uvicorn main:app --reload --port 8000
```

The API is available at **http://localhost:8000**. Docs at **http://localhost:8000/docs**.

### Local Embeddings with Ollama (optional)

If `EMBEDDING_PROVIDERS=ollama`, install Ollama and pull a model:

```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull bge-m3
```

---

## 5. Clone & Set Up the Frontend

```bash
cd /path/to/AskAideAI
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api/v1
```

Start the dev server:

```bash
npm run dev
```

The app opens at **http://localhost:5173**.

---

## 6. Environment Variable Reference

### Backend (.env)

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | Yes | `4000` | Express server port |
| `DATABASE_URL` | Yes | — | MongoDB connection string |
| `JWT_SECRET` | Yes | — | Secret for signing JWTs |
| `AI_ENDPOINT` | Yes | — | Base URL of the AI service |
| `AI_QUESTION_REQ_URL` | Yes | — | Full URL for question generation |
| `REDIS_URL` | No | — | Redis connection string |
| `CLOUD_NAME` | No | — | Cloudinary cloud name |
| `API_KEY` | No | — | Cloudinary API key |
| `API_SECRET` | No | — | Cloudinary API secret |
| `MAIL_HOST` | No | `smtp.gmail.com` | SMTP host |
| `MAIL_USER` | No | — | SMTP username |
| `MAIL_PASS` | No | — | SMTP password / app password |
| `NODE_ENV` | No | `development` | `development` or `production` |

### AI Service (.env)

| Variable | Required | Default | Description |
|---|---|---|---|
| `LLM_PROVIDER` | Yes | — | `openrouter`, `openai`, `gemini`, or `anthropic` |
| `EMBEDDING_PROVIDERS` | Yes | — | Comma-separated: `ollama`, `external`, `openai`, `google` |
| `QDRANT_HOST` | Yes | — | Qdrant host (e.g. `http://localhost`) |
| `QDRANT_PORT` | No | `6333` | Qdrant HTTP port |
| `QDRANT_API_KEY` | No | — | Qdrant API key (for Qdrant Cloud) |
| `MONGO_URI` | Yes | — | MongoDB connection string (no trailing DB name) |
| `MONGO_DB_NAME` | Yes | — | MongoDB database name |
| `REDIS_HOST` | No | `localhost` | Redis host |
| `REDIS_PORT` | No | `6379` | Redis port |
| `OPENAI_API_KEY` | Conditional | — | Required if `LLM_PROVIDER=openai` or embedding uses OpenAI |
| `GEMINI_API_KEY` | Conditional | — | Required if `LLM_PROVIDER=gemini` |
| `ANTHROPIC_API_KEY` | Conditional | — | Required if `LLM_PROVIDER=anthropic` |
| `OPENROUTER_API_KEY` | Conditional | — | Required if `LLM_PROVIDER=openrouter` |
| `OLLAMA_BASE_URL` | No | `http://localhost:11434` | Ollama server URL |

### Frontend (.env)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | Yes | — | Backend API base URL (e.g. `http://localhost:4000/api/v1`) |

---

## 7. Running All Services Together

### Terminal 1 — Infrastructure (Docker)

```bash
cd /path/to/AskAideAI
docker compose up -d
```

### Terminal 2 — AI Service

```bash
cd /path/to/AskAideAI/ai-service
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

### Terminal 3 — Backend

```bash
cd /path/to/AskAideAI/Backend
npm run dev
```

### Terminal 4 — Frontend

```bash
cd /path/to/AskAideAI/frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

### Quick check — all services are up

```bash
curl http://localhost:5173       # Frontend
curl http://localhost:4000/ping  # Backend health
curl http://localhost:8000/healthz # AI Service health
```

---

## 8. Verifying the Setup Works

1. **Open the app** — http://localhost:5173 should load the login / landing page.

2. **Register a new account** — fill out the sign-up form. You should receive a confirmation email (if mail is configured), or the account is created immediately.

3. **Log in** — use the credentials you just created. You should be redirected to the student or teacher dashboard depending on your role.

4. **Check Backend logs** — the terminal running `npm run dev` should show request logs without errors.

5. **Check AI Service logs** — the terminal running `uvicorn` should show incoming request logs.

6. **Test an AI endpoint directly** (optional):

```bash
# Generate questions
curl -X POST http://localhost:8000/generate-questions \
  -H "Content-Type: application/json" \
  -d '{"chapterId": "test", "count": 5}'
```

7. **Check MongoDB** — connect and verify data:

```bash
mongosh --eval "use askaideai; db.users.find().limit(5).pretty()"
```

---

## 9. Common Issues & Fixes

### "Cannot find module" errors (Backend)

```bash
cd Backend
rm -rf node_modules
npm install
```

### MongoDB connection refused

- Make sure MongoDB is running: `mongosh --eval "db.runCommand({ping:1})"`
- If using Docker: `docker compose up -d mongodb`
- Check `DATABASE_URL` in `Backend/.env` — ensure the port and auth source are correct

### Qdrant connection errors (AI Service)

- Verify Qdrant is running: `curl http://localhost:6333/healthz`
- If using Qdrant Cloud, ensure `QDRANT_API_KEY` and `QDRANT_HOST` include the full URL with `https://`
- The collection is created automatically on first document upload

### Redis connection refused

- Make sure Redis is running: `redis-cli ping`
- If using Docker: `docker compose up -d redis`
- Check `REDIS_HOST` and `REDIS_PORT` in the AI service `.env`

### Frontend shows blank page or API errors

- Confirm `VITE_API_URL` in `frontend/.env` points to the backend: `http://localhost:4000/api/v1`
- Restart the Vite dev server after changing `.env` — Vite does not hot-reload env files
- Check the browser console for CORS errors — the backend allows all origins in development by default

### Port already in use

```bash
# Find what's using port 4000
lsof -i :4000
# Kill it
kill -9 <PID>
```

### Python / pip version conflicts

```bash
python3 -m venv --clear venv   # recreate the virtual environment
source venv/bin/activate
pip install -r requirements.txt
```

### "VITE_API_URL is not defined" in the frontend

- Make sure the file is named `.env` (not `.env.local` or `.env.bak`)
- Restart the dev server after creating the `.env` file

---

## 10. IDE / Editor Recommendations

### VS Code (primary recommendation)

Install these extensions:

| Extension | Purpose |
|---|---|
| **ESLint** | Linting for frontend & backend JS |
| **Prettier** | Code formatting |
| **Tailwind CSS IntelliSense** | Tailwind class autocomplete |
| **Python** | Python language support for AI service |
| **Pylance** | Type checking for Python |
| **Thunder Client** or **REST Client** | API testing without leaving VS Code |
| **MongoDB for VS Code** | Browse collections directly in the editor |
| **Docker** | Manage containers from the sidebar |

Recommended `settings.json` additions:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter"
  }
}
```

### Other editors

- **WebStorm / IntelliJ** — full support for JS, Python, and Docker out of the box
- **Neovim / Helix** — works with LSP servers for JS and Python
- **Zed** — fast, built-in language support for the stack

---

## Architecture at a Glance

```
Browser (localhost:5173)
  └─▶ Frontend (Vite dev server)
        └─▶ Backend (Express :4000)
              └─▶ AI Service (FastAPI :8000)
                    ├─▶ Qdrant (vector DB)
                    ├─▶ MongoDB (documents)
                    └─▶ Redis (cache)
```

The frontend never talks to the AI service directly. All AI calls are proxied through the backend.

---

For questions or issues, check the existing `CLAUDE.md` files in each service directory, or open an issue at the repository.
