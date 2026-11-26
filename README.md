# Compliance Analysis

Monorepo for the Compliance Analysis system.

| Folder | What it is | Stack |
|---|---|---|
| `backend/` | REST API: auth, organizations, frameworks, products; vector search for compliance matching | Node.js, Express, MongoDB, Qdrant, Cloudinary, Hugging Face |
| `frontend/` | Web app | React, Vite, MUI |

## Running locally

Backend (port 3000 by default):

```bash
cd backend
cp .env.example .env   # then fill in your own values
npm install
npm run dev
```

Frontend (Vite dev server, port 5173 by default):

```bash
cd frontend
npm install
npm run dev
```

Never commit `.env`; it is ignored by `.gitignore`.
