# StockSeer.AI - AI-Powered Stock Analysis Platform

A comprehensive stock analysis platform with AI-powered insights, technical indicators, and real-time market data.

## 🏗️ Project Structure

```
stockseer--ai-main/
├── backend/                    # FastAPI Backend Server
│   ├── app.py                 # Main FastAPI application
│   ├── stock_utils.py         # Stock data utilities
│   ├── news_utils.py          # News scraping utilities
│   ├── signal_utils.py        # Trading signal generation
│   ├── logo_utils.py          # Company logo utilities
│   ├── utils.py               # General utilities
│   ├── ui_utils.py            # UI helper functions
│   ├── about_tab.py           # About page content
│   ├── requirements.txt       # Python dependencies
│   ├── start_backend.py       # Backend startup script
│   ├── start_backend.bat      # Windows batch file
│   └── start_backend.sh       # Unix shell script
├── stockseer-frontend/        # React Frontend Application
│   ├── src/                   # React source code
│   ├── public/                # Static assets
│   ├── package.json           # Node.js dependencies
│   └── vite.config.ts         # Vite configuration
├── app.py                     # Original Streamlit application
├── requirements.txt           # Streamlit dependencies
├── start_stockseer.py         # Main launcher script
├── start_stockseer.bat        # Windows launcher
└── README.md                  # This file
```

## 🚀 Quick Start

### Option 1: Start Everything (Recommended)
```bash
# Windows
start_stockseer.bat

# Or using Python
python start_stockseer.py
```

### Option 2: Start Backend Only
```bash
cd backend
python start_backend.py
```

### Option 3: Start Frontend Only
```bash
cd stockseer-frontend
npm install
npm run dev
```

## 🔧 Backend Setup

The backend is a FastAPI application that provides REST APIs for stock data, news, and analysis.

### Prerequisites
- Python 3.8+
- pip

### Installation
```bash
cd backend
pip install -r requirements.txt
```

### Running the Backend
```bash
cd backend
python start_backend.py
```

The backend will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## 🎨 Frontend Setup

The frontend is a React application built with Vite, TypeScript, and Tailwind CSS.

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation
```bash
cd stockseer-frontend
npm install
```

### Running the Frontend
```bash
cd stockseer-frontend
npm run dev
```

The frontend will be available at: http://localhost:3000

## 📊 Features

### Backend Features
- **Stock Data API**: Real-time stock prices and historical data
- **Technical Analysis**: RSI, MACD, SMA, and other indicators
- **News Aggregation**: Multiple news sources (Yahoo Finance, Google News, NewsAPI)
- **Company Information**: Detailed company profiles and financials
- **Trading Signals**: AI-powered buy/sell recommendations
- **Portfolio Management**: Track and manage investments
- **Life Planner**: Financial goal tracking
- **Notes System**: Personal investment notes

### Frontend Features
- **Interactive Charts**: Candlestick and line charts with zoom functionality
- **Real-time Updates**: Live stock prices and market data
- **Responsive Design**: Works on desktop and mobile
- **Dark Theme**: Modern dark UI design
- **Tab Navigation**: Organized feature access
- **Search Functionality**: Find stocks quickly
- **Portfolio Tracking**: Visual portfolio management

## 🔌 API Endpoints

### Stock Data
- `GET /stocks/{symbol}` - Get stock information
- `GET /stocks/{symbol}/chart` - Get historical chart data
- `GET /stocks/{symbol}/technical` - Get technical indicators
- `GET /stocks/{symbol}/info` - Get company information
- `GET /stocks/search-simple` - Search for stocks

### News
- `GET /stocks/{symbol}/news` - Get stock-specific news
- `GET /news/scrape/google` - Get Google News
- `GET /news/scrape/yahoo/{symbol}` - Get Yahoo Finance news

### Portfolio
- `GET /portfolio` - Get portfolio holdings
- `POST /portfolio` - Add stock to portfolio
- `PUT /portfolio/{symbol}` - Update holding
- `DELETE /portfolio/{symbol}` - Remove from portfolio

### Life Planner
- `GET /life-planner/goals` - Get financial goals
- `POST /life-planner/goals` - Create new goal
- `PUT /life-planner/goals/{goal_id}` - Update goal
- `DELETE /life-planner/goals/{goal_id}` - Delete goal

### Notes
- `GET /notes` - Get all notes
- `POST /notes` - Create new note
- `PUT /notes/{note_id}` - Update note
- `DELETE /notes/{note_id}` - Delete note

## 🛠️ Development

### Backend Development
```bash
cd backend
# Install dependencies
pip install -r requirements.txt

# Run with auto-reload
python start_backend.py
```

### Frontend Development
```bash
cd stockseer-frontend
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📝 Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```env
NEWS_API_KEY=your_newsapi_key_here
```

### API Configuration
The frontend uses a centralized API URL from `VITE_API_BASE_URL`. Local development uses `http://127.0.0.1:8000` (the FastAPI startup script's default). Production builds require `VITE_API_BASE_URL` and never fall back to a local address.

### Separate development and production deployments

The Vite frontend reads `VITE_API_BASE_URL` from the Vercel project environment. Keep this existing variable name; the source does not read `VITE_API_URL`. Set it independently in each Vercel project (Production environment scope):

- Development Vercel project (`master`, `https://stockseerai-dev.vercel.app`): `VITE_API_BASE_URL=https://stockseer--ai-dev.onrender.com`.
- Production Vercel project (`main`, `https://stockseer-ai.vercel.app`): keep `VITE_API_BASE_URL=https://stockseer-ai-1.onrender.com`.

For each Render service, set the root directory to `backend`, install with `pip install -r requirements.txt`, and start with `python start_backend.py`; the startup script binds to `0.0.0.0` and uses the platform-provided `PORT` in deployed environments. Set `CORS_ALLOWED_ORIGINS` independently on each Render service as a comma-separated exact origin list. The development service must include `https://stockseerai-dev.vercel.app`; the production service must continue including `https://stockseer-ai.vercel.app`. Local origins may also be included as needed. The FastAPI middleware preserves credentials and handles preflight requests with the configured methods and headers. No wildcard or Vercel-wide origin pattern is used. The API URL is public frontend configuration; never put backend credentials there.

Changing either Vercel environment variable requires a new deployment because Vite embeds it into the frontend build. Keep the development and production Vercel projects and Render services mapped to their matching branches and URLs.

Set `PYTHON_VERSION=3.11.9` on the development Render service to pin its runtime without changing production. The repo has no Python runtime pin file; do not add a root `.python-version` unless both services should use that same version.

Local Vite development reads `stockseer-frontend/.env.development`, which should set `VITE_API_BASE_URL=http://127.0.0.1:8000`. Start the backend in one terminal with `cd backend` then `python start_backend.py` (Windows users may use `py start_backend.py`); in another, run `cd stockseer-frontend`, `npm install`, and `npm run dev`. The backend health check is `GET http://127.0.0.1:8000/health`. Copy `.env.example` as a reference for other environments. Frontend build command: `npm run build` from `stockseer-frontend`.

### AI & Risk analysis methodology

`GET /api/ml/analysis/{ticker}?period=2y&horizon=5` returns ticker-keyed daily analytics based on Yahoo Finance history. Allowed periods are `1y`, `2y`, and `5y`; forecast horizons are 1, 5, and 20 trading sessions. The analysis drops invalid OHLC observations, deduplicates timestamps, uses adjusted close when complete, and returns a structured 503 when data cannot support analysis. A 15-minute in-process cache is keyed by ticker, period, horizon, and analysis version; cache entries are not persisted across service restarts.

The risk score averages three equally weighted trailing-history percentiles: 63-session annualized volatility, 63-session maximum drawdown, and 63-session historical 95% VaR. Equal weights are explicit because the inputs share one percentile scale and this repository has no outcome-calibrated weighting study; the score does not claim learned weights. It requires all three percentile histories (at least 60 rolling observations) and is a relative historical rank, not a probability. Classification bands are quintiles of that 0–100 rank: Low (0–20), Moderate (20–40), Elevated (40–60), High (60–80), and Very High (80–100). Annualized statistics use 252 trading sessions; Sharpe assumes a zero risk-free rate. Historical VaR/CVaR use the empirical daily-return tail.

Forecasts use standardized ridge regression (alpha 1) with lagged returns, SMA gap, RSI, and rolling volatility. The model is evaluated on expanding-window, chronological, non-overlapping forecast origins; training labels are purged until their horizon outcome is known. The zero-return forecast is the baseline. A point estimate is shown only with at least 60 test origins, lower MAE than the baseline, and directional accuracy above 50%; otherwise the estimate is withheld. The fit and evaluation are cached in process for 15 minutes. No probability or prediction interval is claimed. The previous TSLA-model fallback and unvalidated `/ml/predict` and `/predictions/{ticker}` endpoints now return HTTP 410. Forecast-versus-actual history is not charted because forecasts are not persisted before outcomes occur.

Run the same offline evaluation from the backend with `python -m ml_pipeline.train --ticker TCS.NS --period 5y --horizon 5` after installing `backend/requirements.txt`. It requires provider history and exits with status 2 when data cannot support an evaluation; it does not write a model artifact.

## 🐛 Troubleshooting

### Backend Issues
1. **Import Errors**: Make sure all dependencies are installed
2. **Port Already in Use**: Change the port in `start_backend.py`
3. **API Key Issues**: Check your NewsAPI key in environment variables

### Frontend Issues
1. **Build Errors**: Clear node_modules and reinstall
2. **API Connection**: Ensure backend is running on port 8000
3. **CORS Issues**: Backend has CORS enabled for localhost:3000

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation at http://localhost:8000/docs
- Review the troubleshooting section above
