# LiveMarketData Component

A comprehensive Next.js + TypeScript + Tailwind component that displays real-time cryptocurrency and precious metals market data.

## 🚀 Features

- **Real-time Data**: Fetches live prices from CoinGecko and Metals API
- **Auto-refresh**: Updates every 60 seconds automatically
- **Responsive Design**: Works on all screen sizes with Tailwind CSS
- **Loading States**: Beautiful skeleton loading animations
- **Error Handling**: Graceful error states with retry functionality
- **Manual Refresh**: Button to manually refresh data
- **Status Indicators**: Shows API status and last update time

## 📊 Data Sources

### Cryptocurrencies (CoinGecko API)
- **Endpoint**: `https://api.coingecko.com/api/v3/coins/markets`
- **Data**: Top 10 cryptocurrencies by market cap
- **Fields**: Name, Symbol, Price, 24h Change %, Market Cap, Volume
- **Rate Limit**: 10-50 calls/minute (free tier)

### Precious Metals (Metals API)
- **Endpoint**: `https://metals-api.com/api/latest`
- **Metals**: Gold (XAU), Silver (XAG), Platinum (XPT), Palladium (XPD)
- **Fields**: Price, 24h Change %, Symbol
- **Rate Limit**: 100 requests/month (free tier)

## 🛠️ Installation & Setup

### 1. Environment Variables

Create a `.env.local` file in your Next.js project root:

```bash
# Metals API Key
NEXT_PUBLIC_METALS_API_KEY=your_metals_api_key_here

# Optional: CoinGecko Pro API Key (for higher rate limits)
NEXT_PUBLIC_COINGECKO_API_KEY=your_coingecko_pro_api_key_here
```

### 2. Get API Keys

#### Metals API
1. Go to https://metals-api.com/
2. Click "Get Free API Key"
3. Sign up with your email
4. Copy your API key

#### CoinGecko (Optional)
- Free tier doesn't require an API key
- For Pro features: https://www.coingecko.com/en/api/pricing

### 3. Dependencies

Make sure you have these packages installed:

```bash
npm install framer-motion lucide-react
```

And ensure you have shadcn/ui components:
- Card
- Button

## 📱 Usage

### Basic Usage

```tsx
import LiveMarketData from '@/components/LiveMarketData';

export default function Page() {
  return (
    <div>
      <h1>Market Dashboard</h1>
      <LiveMarketData />
    </div>
  );
}
```

### Integration in GoldCryptoPage

The component is already integrated into the `/gold` page below the hero section.

## 🎨 Customization

### Styling
The component uses Tailwind CSS classes and can be customized by:
- Modifying the color scheme in the component
- Adjusting spacing and layout
- Changing the grid responsiveness

### Data Display
You can customize:
- Number of cryptocurrencies shown (currently 10)
- Which metals to display
- Price formatting
- Change percentage thresholds

### Refresh Interval
Change the auto-refresh interval by modifying:
```tsx
// Currently set to 60 seconds
const interval = setInterval(() => {
  loadData();
}, 60000); // Change this value
```

## 🔧 Component Structure

```
LiveMarketData/
├── Types & Interfaces
│   ├── CryptoData
│   ├── MetalData
│   └── ApiStatus
├── Configuration
│   ├── METAL_CONFIG
│   └── API_CONFIG
├── Utility Functions
│   ├── formatPrice()
│   ├── formatMarketCap()
│   ├── fetchCryptoData()
│   └── fetchMetalsData()
└── Main Component
    ├── State Management
    ├── Effects (useEffect)
    ├── Event Handlers
    └── Render Logic
```

## 📊 Data Flow

1. **Component Mount**: Triggers initial data fetch
2. **API Calls**: Parallel requests to CoinGecko and Metals API
3. **Data Processing**: Format and structure the response data
4. **State Update**: Update component state with new data
5. **UI Render**: Display data with animations
6. **Auto-refresh**: Repeat every 60 seconds

## 🚨 Error Handling

The component handles various error scenarios:

- **Network Errors**: Shows error state with retry option
- **API Rate Limits**: Graceful degradation
- **Invalid Data**: Fallback to previous data
- **Loading States**: Skeleton animations during fetch

## 🎯 Performance Optimizations

- **Parallel API Calls**: Fetches crypto and metals data simultaneously
- **Memoization**: Prevents unnecessary re-renders
- **Efficient Updates**: Only updates changed data
- **Cleanup**: Properly clears intervals on unmount

## 🔒 Security Considerations

- **API Keys**: Store in environment variables
- **CORS**: Handles cross-origin requests properly
- **Rate Limiting**: Respects API rate limits
- **Error Logging**: Logs errors without exposing sensitive data

## 📈 Future Enhancements

Potential improvements:
- WebSocket connections for real-time updates
- Historical price charts
- Price alerts and notifications
- Portfolio tracking integration
- More detailed market metrics
- Dark/light theme toggle
- Export functionality

## 🐛 Troubleshooting

### Common Issues

1. **"Failed to load cryptocurrency data"**
   - Check internet connection
   - Verify CoinGecko API is accessible
   - Check browser console for CORS errors

2. **"Failed to load metals data"**
   - Verify Metals API key is correct
   - Check if API key has remaining requests
   - Ensure API key is in environment variables

3. **Data not updating**
   - Check if auto-refresh is working
   - Verify API rate limits aren't exceeded
   - Check browser console for errors

### Debug Mode

Enable debug logging by adding to your environment:
```bash
NEXT_PUBLIC_DEBUG=true
```

## 📄 License

This component is part of the StockSeer project and follows the same licensing terms.
