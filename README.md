# StockSeer.AI

StockSeer.AI is a stock research application with a React and TypeScript web frontend, a FastAPI backend, and a legacy Streamlit interface. It provides market data, charts, technical indicators, company and news research, watchlists, portfolio tools, alerts, financial planning, and data-backed risk analytics.

## Project layout

```text
.
├── backend/                 FastAPI API, market-data helpers, database and ML analytics
│   ├── app.py               API application and routes
│   ├── start_backend.py     Local and Render startup entry point
│   ├── requirements.txt     Python dependencies
│   └── ml_pipeline/         Risk analytics and forecast evaluation
├── stockseer-frontend/      React, TypeScript and Vite application
│   ├── src/                 Pages, components, services and API configuration
│   ├── scripts/             Full-stack launcher and deployment API guard
│   ├── .env.development     Local frontend API setting
│   └── package.json         Frontend commands and dependencies
├── app.py                   Legacy Streamlit application
└── docker-compose.yml       Legacy Compose configuration (see note below)
```

## Requirements

- Python 3.11 is recommended for the backend. Set the development Render service to Python 3.11.9 if you want to pin its runtime.
- Node.js compatible with Vite 7 (Node.js 20.19+ or 22.12+) and npm.
- Git for cloning and branch-based development.

## Run locally

The React frontend and FastAPI backend run as separate processes. The checked-in `stockseer-frontend/.env.development` points the frontend to `http://127.0.0.1:8000`.

### 1. Install backend dependencies

From the repository root, on Windows PowerShell:

```powershell
cd backend
py -3.11 -m venv .venv-local
.\.venv-local\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

On macOS or Linux, create and activate a virtual environment with `python3 -m venv .venv-local` and `source .venv-local/bin/activate`, then install `backend/requirements.txt`.

Start the API from the `backend` directory:

```powershell
python start_backend.py
```

The server listens on `http://127.0.0.1:8000` locally. The root and `/health` endpoints are lightweight health checks; interactive API documentation is at `/docs` and `/redoc`.

### 2. Install and start the frontend

Open a second terminal in the repository root:

```powershell
cd stockseer-frontend
npm ci
npm run dev
```

Vite serves the application at `http://localhost:3000`. Use `npm install` instead of `npm ci` if you are intentionally updating the lockfile.

### Optional launchers

- `npm run dev:full` starts the FastAPI backend, the legacy Streamlit app, and the Vite frontend from the frontend directory. It may install missing Python packages into the selected Python environment; using an activated virtual environment is recommended.
- `npm run backend` starts the FastAPI backend from the frontend directory.
- `npm run streamlit` starts the legacy Streamlit app at port 8501.
- `python app.py` runs the FastAPI entry point when executed from `backend`; the repository-root `app.py` is the Streamlit application.

The legacy Streamlit app has no separate root `requirements.txt` in this repository. Its dependencies are not fully described by `backend/requirements.txt`. The normal supported setup in this guide is the React frontend plus FastAPI backend.

`docker-compose.yml` references `backend/Dockerfile`, which is not present in the repository, so that legacy Compose configuration cannot currently build the API service as written. Use the local Python and npm setup above.

## Frontend commands

Run from `stockseer-frontend`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server on port 3000 |
| `npm run dev:full` | Start the backend, Streamlit, and frontend together |
| `npm run backend` | Start only the FastAPI backend |
| `npm run streamlit` | Start only the legacy Streamlit app |
| `npm run build` | Run TypeScript project checks, validate the deployment API target, and create the production bundle in `dist/` |
| `npm run preview` | Preview the Vite production bundle locally |
| `npm start` | Serve the existing `dist/` directory with the small Express static server |
| `npm run serve` | Build and then serve the bundle |
| `npm run lint` | Run ESLint |

The build includes a deployment guard. On Vercel, it requires `VERCEL_GIT_COMMIT_REF` to be available and rejects a `master` build unless its API URL is the development backend. Other branches are not remapped automatically.

## API URL and environment configuration

All frontend calls to the FastAPI backend use the shared configuration in `src/utils/apiConfig.ts` and `VITE_API_BASE_URL`. Keep this variable name consistent; production builds require it, and there is no fallback from development to production or vice versa. API paths are joined to the configured backend root by the shared API helpers.

For local development, `stockseer-frontend/.env.development` sets:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

`stockseer-frontend/.env.example` is a reference for this local setting. Vite loads `.env.development` while running `npm run dev`; restart Vite after changing environment files.

The frontend reads these Firebase client settings from Vite environment variables when configuring authentication and Firestore. Supply the values from the Firebase project used by the deployment:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

Use the appropriate Firebase project values for each frontend deployment. These are public client configuration embedded in the frontend bundle; never put server credentials or private keys in `VITE_` variables.

The backend loads environment variables with `python-dotenv`. `GEMINI_API_KEY` is used by the chat endpoint. `CORS_ALLOWED_ORIGINS` optionally configures the exact browser origins allowed by that backend service; when omitted, the backend uses its built-in defaults. Values are comma-separated origins, for example:

```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

The backend validates configured origins as HTTP(S) origins without paths or credentials. CORS allows credentials and the configured methods and headers. Do not use a wildcard origin with credentialed requests.

## Dev and production deployments

Keep the Vercel frontend projects and Render backend services mapped independently. Vite embeds `VITE_API_BASE_URL` into each frontend build, so changing a Vercel value requires a new deployment.

| Environment | Frontend | Branch | Backend | Vercel `VITE_API_BASE_URL` |
| --- | --- | --- | --- | --- |
| Development | `https://stockseerai-dev.vercel.app` | `master` | `https://stockseer-ai-dev.onrender.com` | `https://stockseer-ai-dev.onrender.com` |
| Production | `https://stockseer-ai.vercel.app` | `main` | `https://stockseer-ai-1.onrender.com` | `https://stockseer-ai-1.onrender.com` |

Configure the `VITE_API_BASE_URL` value in the **Production** environment scope of each separate Vercel project, and ensure each project deploys its listed branch. Enable Vercel system environment variables so the build can check its branch. The deployment guard specifically protects `master` from accidentally building with a production or missing API URL.

Configure each Render service independently:

- Root directory: `backend`
- Build/install command: `pip install -r requirements.txt`
- Start command: `python start_backend.py`
- Development service: set `CORS_ALLOWED_ORIGINS` to include `https://stockseerai-dev.vercel.app`.
- Production service: preserve the existing production CORS configuration and ensure it continues to allow `https://stockseer-ai.vercel.app`.
- Development service runtime: `PYTHON_VERSION=3.11.9`.

The start script binds to `127.0.0.1:8000` in local development. When Render provides `PORT`, it binds to `0.0.0.0` on that port and disables reload by default. The backend does not add the development Vercel origin to shared CORS defaults; set it only on the development Render service. After changing a Render environment value, redeploy or restart that service.

## API overview

The FastAPI app documents its complete, current route schema at `/openapi.json`; use `/docs` for the interactive view. Main route groups include:

- Health: `GET /`, `GET /health`, and `GET /health/deep`
- Stock data: `/stocks/{symbol}`, chart, technical indicators, financials, company information, and search endpoints
- News: stock news, market news, and provider-backed news scraping endpoints
- Market data and analysis: `/api/metals`, `/market/simulation`, `/screener/run`, and `/api/ml/analysis/{symbol}`
- User features: watchlists, portfolios, alerts, notes, life-planner goals, subscription access, and dummy-account routes
- Research features: live research notes and analysis reports
- Chat: `/chat` and `/chatbot/query` (the Gemini-backed chat endpoint requires `GEMINI_API_KEY`)

For the validated risk analysis endpoint, an example request is:

```text
GET /api/ml/analysis/TCS.NS?period=2y&horizon=5
```

Allowed periods are `1y`, `2y`, and `5y`; forecast horizons are 1, 5, and 20 trading sessions. This analysis uses Yahoo Finance history, validates and cleans observations, and returns structured data quality and risk metrics. Results are cached in process for 15 minutes; the cache is not shared across workers or persisted across restarts. Insufficient or unavailable history returns an error rather than silently substituting a different ticker or model.

Risk score details:

- The score combines equal weighted trailing-history percentiles for 63-session annualized volatility, maximum drawdown, and historical 95% VaR. Equal weights are transparent defaults, not learned or outcome-calibrated weights.
- The score is a relative historical rank, not a probability. It requires enough history for all three components. Classification bands divide the 0-100 scale into Low, Moderate, Elevated, High, and Very High quintiles.
- Annualized statistics use 252 trading sessions. Sharpe uses a zero risk-free rate. VaR and CVaR use the empirical daily-return tail.
- Forecasts use standardized ridge regression with lagged returns, SMA gap, RSI, and rolling volatility. Evaluation uses expanding chronological windows, non-overlapping forecast origins, and purges training labels until their horizon outcome is known. A zero-return forecast is the baseline.
- A point estimate is shown only when there are at least 60 test origins, the model has lower MAE than the baseline, and directional accuracy exceeds 50%. Otherwise the forecast estimate is withheld. No probability or prediction interval is claimed.
- Legacy heuristic prediction endpoints return HTTP 410 and direct clients to `/api/ml/analysis/{symbol}`. Forecast-versus-actual history is not charted because forecasts are not persisted before outcomes occur.

To run the same offline evaluation after installing backend requirements:

```powershell
cd backend
python -m ml_pipeline.train --ticker TCS.NS --period 5y --horizon 5
```

It retrieves provider history, prints the evaluation as JSON, writes no model artifact, and exits with status 2 when it cannot evaluate the data.

## Troubleshooting

### Frontend reports a connection error

1. Confirm the backend is running and `http://127.0.0.1:8000/health` returns JSON with `"status": "ok"`.
2. Confirm `stockseer-frontend/.env.development` points to `http://127.0.0.1:8000` for local Vite development.
3. Restart Vite after editing `.env.development`; Vite reads environment values at startup and embeds build values into bundles.
4. For a deployed frontend, check that its Vercel `VITE_API_BASE_URL` matches the backend in the deployment table, then redeploy.
5. If the browser console reports CORS, check the matching Render service's `CORS_ALLOWED_ORIGINS` for the exact frontend origin, including scheme and hostname.

### Backend does not start

1. Activate the intended Python environment and install `backend/requirements.txt`.
2. Run `python start_backend.py` from the `backend` directory so local imports resolve correctly.
3. Check whether another process is using port 8000. Set `PORT` to another port for local use and set the same value in `VITE_API_BASE_URL` if you change it.
4. Inspect the first Python traceback for the missing module or configuration error.

### Vercel build rejects the API target

Check the project's Git branch, `VITE_API_BASE_URL`, and availability of Vercel system environment variables. The `master` development build must use `https://stockseer-ai-dev.onrender.com`. The production project's `main` build should retain `https://stockseer-ai-1.onrender.com`.

## Data and operational notes

- Market history and related information are fetched from external providers such as Yahoo Finance; availability, freshness, and rate limits depend on those providers.
- Database and background scheduler initialization run as a background startup task. The deep health route checks database connectivity; `/health` is intended as a lightweight process health check.
- The backend includes local SQLite support and optional database connection behavior in `database.py`. Do not assume local files on a hosted service provide durable storage.
- API URL values in frontend bundles are public. Keep secrets such as `GEMINI_API_KEY` and database credentials in backend-only environment settings.

## Contributing

1. Create a branch from the intended base (`master` for development or `main` for production).
2. Install backend and frontend dependencies using the steps above.
3. Keep local settings in ignored environment files and never commit secrets.
4. Run relevant checks before opening a pull request. For frontend changes, `npm run build` runs TypeScript checks and the deployment API guard; `npm run lint` runs ESLint.
5. Confirm deployment environment values remain scoped to the correct Vercel project and Render service.
