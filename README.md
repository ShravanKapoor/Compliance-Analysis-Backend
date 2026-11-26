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

Backend tests: `cd backend && npm test`

## Compliance engine

The engine checks a product against the controls of every framework that applies to it and produces a scored report.

1. **Select frameworks.** Active frameworks that apply to products and to one of the product's markets (frameworks marked `Global`, or with no country, always apply). You can also pass `frameworkIds` to choose them yourself.
2. **Collect evidence.** The product's profile (type, intended use, device class, markets, approvals) plus its evidence items (test reports, procedures, certifications...) are split into chunks and embedded with Hugging Face (`all-MiniLM-L6-v2`).
3. **Match.** Each control is compared with every evidence chunk. Control vectors are cached in Qdrant and re-embedded automatically when a control changes. Without Qdrant they are embedded on each run.
4. **Assess.** Each control gets a status: `met`, `partial`, `not_met` or `not_applicable`.
   - **With `ANTHROPIC_API_KEY`:** Claude reads the closest evidence and decides, with a rationale, the evidence it relied on and a remediation step.
   - **Without it:** an evidence-similarity check decides. This only shows whether matching evidence exists, so the report status is `under_review`, not `compliant`.
5. **Score.** A 0-100 score weighted by risk (high 3, medium 2, low 1; partial counts half). The product is `compliant` when the score is at least 80 and no mandatory control is `not_met`. The report lists the gaps, most serious first.

### API

All routes need the login cookie.

| Method | Route | What it does |
|---|---|---|
| POST | `/api/product/create` | Create a product. JSON or multipart (up to 5 `images`). Required: `productName`, `company`. Optional: `regulatory`, `evidence: [{ title, content }]` |
| GET | `/api/product?company=<id>` | List products |
| GET | `/api/product/:id` | One product, with its evidence |
| POST | `/api/product/:id/evidence` | Add evidence: `{ title, content }` or `{ evidence: [...] }` (owner or admin) |
| DELETE | `/api/product/:id/evidence/:evidenceId` | Remove an evidence item (owner or admin) |
| POST | `/api/compliance/analyze/:productId` | Run an analysis. Optional body `{ frameworkIds: [...] }` (owner or admin) |
| GET | `/api/compliance/reports?productId=<id>` | Report summaries, newest first |
| GET | `/api/compliance/reports/:id` | Full report, every control |
| POST | `/api/framework/:id/index` | Re-index a framework's controls in Qdrant (admin) |

Run `npm run qdrant:init` once to create the Qdrant collection (it is also created on first use).
