# StockSeer.AI Frontend

A modern React-based frontend for StockSeer.AI, providing comprehensive stock analysis, portfolio management, and AI-powered insights.

## Features

### Core Tabs
- **📊 Overview** - Stock overview with charts and technical indicators
- **💰 Financials** - Financial statements and valuation metrics
- **📰 News** - News aggregation with sentiment analysis
- **📈 Performance** - Advanced performance analysis and Monte Carlo simulations
- **🤖 Chat** - AI-powered chatbot for stock queries
- **🧠 AI & Risk** - AI-driven insights and risk assessment
- **🎯 Life Planner** - Financial goal planning and tracking
- **🏢 Company** - Company information and analysis
- **ℹ️ About** - Platform information and features
- **📚 Tutorial** - Learning resources and guides
- **👀 Watchlist** - Stock tracking and monitoring
- **🔍 Screener** - Stock filtering and screening
- **🔔 Alerts** - Price and technical alerts
- **📝 Notes** - Research notes and insights

### Key Features
- **Real-time Stock Data** - Live stock prices and market data
- **Interactive Charts** - Price charts with technical indicators
- **Portfolio Management** - Track holdings and performance
- **AI Analysis** - Machine learning insights and predictions
- **Risk Assessment** - Comprehensive risk metrics and analysis
- **News Integration** - Real-time news with sentiment analysis
- **Responsive Design** - Mobile-friendly interface
- **Dark Theme** - Modern dark UI design

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **UI Components**: Shadcn/ui components
- **Styling**: Tailwind CSS
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React icons
- **State Management**: React hooks and context
- **Build Tool**: Vite

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd stockseer-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/
│   ├── ui/           # Shadcn/ui components
│   └── tabs/         # Tab components for each feature
├── types/            # TypeScript type definitions
├── Dashboard.tsx     # Main dashboard component
└── main.tsx         # Application entry point
```

## Component Architecture

Each tab is implemented as a separate React component with:
- **Props Interface** - Type-safe component props
- **State Management** - Local state for component-specific data
- **Event Handlers** - User interaction functions
- **Data Fetching** - API calls and data processing
- **UI Rendering** - Responsive and accessible interface

## Data Flow

1. **User Input** - Stock search, form submissions
2. **API Calls** - Backend data fetching
3. **State Updates** - React state management
4. **UI Updates** - Component re-rendering
5. **User Feedback** - Loading states, error handling

## Styling

The application uses Tailwind CSS with:
- **Dark Theme** - Slate color palette
- **Responsive Grid** - Mobile-first design
- **Component Variants** - Consistent button and card styles
- **Custom Classes** - Application-specific styling

## Future Enhancements

- **Real-time Updates** - WebSocket integration
- **Advanced Charts** - More chart types and indicators
- **User Authentication** - Login and user profiles
- **Data Persistence** - Local storage and database
- **Mobile App** - React Native version
- **PWA Support** - Progressive web app features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
