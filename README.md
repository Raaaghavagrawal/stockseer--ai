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
The frontend uses a centralized API URL from `VITE_API_BASE_URL`. Local development defaults to `http://localhost:8000`.

### Separate development and production deployments

The Vite frontend reads `VITE_API_BASE_URL` from the Vercel project environment. Configure it independently in each project (Production environment scope):

- Development Vercel project (`master`, `https://stockseerai-dev.vercel.app`): set it to the public URL of the development Render service.
- Production Vercel project (`main`, `https://stockseer-ai.vercel.app`): keep it set to `https://stockseer-ai-1.onrender.com`.

Set `CORS_ALLOWED_ORIGINS` independently on each Render service as a comma-separated exact origin list. For development use `https://stockseerai-dev.vercel.app,http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173`; for production use `https://stockseer-ai.vercel.app,https://stockseer--ai.vercel.app,http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173`. No wildcard or Vercel-wide origin pattern is enabled. The API URL is public frontend configuration; never put backend credentials there.

Set `PYTHON_VERSION=3.11.9` on the development Render service to pin its runtime without changing production. The repo has no Python runtime pin file; do not add a root `.python-version` unless both services should use that same version.

Local Vite development uses `stockseer-frontend/.env.development` and `http://localhost:8000`. Copy `.env.example` as a reference for other environments. Frontend build command: `npm run build` from `stockseer-frontend`.

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
