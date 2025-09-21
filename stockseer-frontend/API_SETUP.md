# Market Data API Setup Guide

This guide will help you set up real-time market data for the Gold & Crypto page using Twelve Data and Alpha Vantage APIs.

## 🔑 API Keys Required

### 1. Twelve Data API (Cryptocurrency Data)
- **Website**: https://twelvedata.com/
- **Free Tier**: 800 requests/day
- **Sign up**: Create a free account and get your API key

### 2. Metals API (Precious Metals Data - Primary)
- **Website**: https://metals-api.com/
- **Free Tier**: 100 requests/month
- **Sign up**: Create a free account and get your API key

### 3. Alpha Vantage API (Precious Metals Data - Fallback)
- **Website**: https://www.alphavantage.co/
- **Free Tier**: 25 requests/day
- **Sign up**: Create a free account and get your API key

## ⚙️ Configuration Steps

### Step 1: Create Environment File
Create a `.env` file in the `stockseer-frontend` directory:

```bash
# Market Data API Configuration
REACT_APP_TWELVE_DATA_API_KEY=your_twelve_data_api_key_here
REACT_APP_METALS_API_KEY=your_metals_api_key_here
REACT_APP_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here
```

### Step 2: Get API Keys

#### Twelve Data API Key:
1. Go to https://twelvedata.com/
2. Click "Get Started Free"
3. Sign up with your email
4. Verify your email
5. Go to your dashboard
6. Copy your API key from the dashboard

#### Metals API Key:
1. Go to https://metals-api.com/
2. Click "Get Free API Key"
3. Sign up with your email
4. Verify your email
5. Copy your API key from the dashboard

#### Alpha Vantage API Key (Fallback):
1. Go to https://www.alphavantage.co/support/#api-key
2. Fill out the form with your email
3. Click "GET FREE API KEY"
4. Check your email for the API key
5. Copy the API key from the email

### Step 3: Update Environment File
Replace the placeholder values in your `.env` file:

```bash
REACT_APP_TWELVE_DATA_API_KEY=abc123def456ghi789
REACT_APP_METALS_API_KEY=xyz789uvw456rst123
REACT_APP_ALPHA_VANTAGE_API_KEY=def456ghi789jkl012
```

### Step 4: Restart Development Server
After adding the API keys, restart your development server:

```bash
npm start
```

## 📊 Supported Assets

### Precious Metals (Metals API + Alpha Vantage Fallback)
- **Gold** (XAU/USD)
- **Silver** (XAG/USD)
- **Platinum** (XPT/USD)
- **Palladium** (XPD/USD)
- **Rhodium** (RH/USD)
- **Iridium** (IR/USD)
- **Ruthenium** (RU/USD)
- **Osmium** (OS/USD)

### Cryptocurrencies (Twelve Data)
- **Bitcoin** (BTC/USD)
- **Ethereum** (ETH/USD)
- **Binance Coin** (BNB/USD)
- **Solana** (SOL/USD)
- **Ripple** (XRP/USD)
- **Cardano** (ADA/USD)
- **Avalanche** (AVAX/USD)
- **Polkadot** (DOT/USD)
- **Chainlink** (LINK/USD)
- **Polygon** (MATIC/USD)
- **Uniswap** (UNI/USD)
- **Cosmos** (ATOM/USD)
- **NEAR Protocol** (NEAR/USD)
- **Fantom** (FTM/USD)
- **Algorand** (ALGO/USD)
- **Dogecoin** (DOGE/USD)

## 🔄 Data Refresh

- **Auto-refresh**: Every 30 seconds
- **Manual refresh**: Click the refresh button
- **Fallback**: If APIs fail, demo data is shown

## ⚠️ Rate Limits

### Free Tier Limits:
- **Twelve Data**: 800 requests/day
- **Metals API**: 100 requests/month
- **Alpha Vantage**: 25 requests/day

### Tips to Stay Within Limits:
- The app makes 1 request per asset per refresh
- With 24 assets, each refresh uses ~24 requests
- Auto-refresh every 30 seconds = ~2,880 requests/day
- Consider upgrading to paid plans for production use

## 🚨 Troubleshooting

### Common Issues:

1. **"API unavailable, showing demo data"**
   - Check if your API keys are correct
   - Verify you haven't exceeded rate limits
   - Check your internet connection

2. **"CORS error"**
   - This is normal for development
   - The APIs work fine in production
   - Demo data will be shown instead

3. **Empty price data**
   - API keys might be invalid
   - Rate limit exceeded
   - Network connectivity issues

### Debug Mode:
Check the browser console for detailed error messages.

## 💡 Production Considerations

For production deployment:

1. **Upgrade API Plans**: Consider paid plans for higher rate limits
2. **Caching**: Implement server-side caching to reduce API calls
3. **Error Handling**: Add more robust error handling and retry logic
4. **Monitoring**: Set up monitoring for API health and rate limits

## 🔧 Customization

You can easily add more assets by updating the `ASSET_CONFIG` in `src/utils/marketApi.ts`:

```typescript
crypto: {
  // Add new crypto assets here
  NEW_COIN: { 
    symbol: 'NEW', 
    name: 'New Coin', 
    icon: '🪙', 
    color: '#123456', 
    tdSymbol: 'NEW/USD' 
  }
}
```

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify your API keys are correct
3. Check the API documentation for any changes
4. Ensure you haven't exceeded rate limits
