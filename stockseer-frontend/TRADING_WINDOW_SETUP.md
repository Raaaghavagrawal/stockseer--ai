# 📈 Trading Window Setup Guide

## 🎯 Overview
The **TradingWindow** component displays live trading data for Indian markets including BSE Sensex, Nifty 50, TCS, Infosys, and Gold prices at the top of the dashboard.

## 🚀 Features

### **📊 Live Trading Data**
- **BSE Sensex**: India's premier stock market index
- **Nifty 50**: National Stock Exchange's benchmark index
- **TCS**: Tata Consultancy Services stock
- **Infosys**: Infosys Limited stock
- **Gold**: Precious metal prices in INR

### **🎨 Professional UI**
- **Compact Layout**: Perfect for dashboard top placement
- **Real-time Updates**: Auto-refresh every 30 seconds
- **Color-coded Indicators**: Green for gains, red for losses
- **Type Indicators**: Different colors for indices, stocks, and commodities
- **Responsive Design**: Works on all screen sizes

### **🔄 Auto-refresh System**
- **30-Second Refresh**: Faster updates for trading data
- **Manual Refresh**: Click refresh button anytime
- **Error Handling**: Graceful fallback to mock data
- **Status Indicators**: Live status dots and timestamps

## 🔧 Technical Implementation

### **Data Sources**
1. **Alpha Vantage API**: For BSE, Nifty, TCS, Infosys
2. **Metals-API**: For Gold prices
3. **Mock Data**: Fallback when APIs are unavailable

### **API Integration**
```typescript
// Alpha Vantage for stocks and indices
const response = await fetch('https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=BSE&apikey=demo');

// Metals-API for gold
const response = await fetch(`https://metals-api.com/api/latest?access_key=${apiKey}&base=INR&symbols=XAU`);
```

### **Component Structure**
- **Header**: Live status and refresh button
- **Trading Cards**: Individual cards for each asset
- **Footer**: Legend and refresh info
- **Error Handling**: Clear error messages

## 🎨 UI Components

### **Trading Cards Layout**
Each trading card displays:
- **Asset Name**: BSE Sensex, Nifty 50, etc.
- **Symbol**: BSE, NIFTY, TCS, INFY, GOLD
- **Current Price**: Formatted in INR
- **Change**: Absolute change with trend arrow
- **Change %**: Percentage change
- **Type Indicator**: Color-coded dot

### **Color Coding**
- **Blue Dot**: Indices (BSE, Nifty)
- **Purple Dot**: Stocks (TCS, Infosys)
- **Yellow Dot**: Commodities (Gold)
- **Green Text**: Positive changes
- **Red Text**: Negative changes

### **Status Indicators**
- **Green Dot**: Live data available
- **Red Dot**: API error or no data
- **Clock Icon**: Last updated timestamp
- **Refresh Button**: Manual refresh option

## 🔧 Setup Instructions

### **1. Environment Variables**
Create `.env.local` in your project root:

```bash
# Alpha Vantage API (for stocks and indices)
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here

# Metals-API (for gold prices)
NEXT_PUBLIC_METALS_API_KEY=your_metals_api_key_here
```

### **2. API Key Sources**

#### **Alpha Vantage** (Recommended)
- **Website**: https://www.alphavantage.co/
- **Free Tier**: 5 requests/minute, 500 requests/day
- **Features**: Global stock quotes, real-time data
- **Setup**: Sign up → Get API key → Add to `.env.local`

#### **Metals-API** (Optional)
- **Website**: https://metals-api.com/
- **Free Tier**: 100 requests/month
- **Features**: Real-time metals prices
- **Setup**: Sign up → Get API key → Add to `.env.local`

### **3. Restart Development Server**
```bash
npm run dev
```

## 📊 Data Display

### **Trading Cards**
| Asset | Symbol | Type | Example Price |
|-------|--------|------|---------------|
| BSE Sensex | BSE | Index | ₹73,261.31 |
| Nifty 50 | NIFTY | Index | ₹22,217.45 |
| TCS | TCS | Stock | ₹3,847.50 |
| Infosys | INFY | Stock | ₹1,456.80 |
| Gold | GOLD | Commodity | ₹196,045.48 |

### **Change Indicators**
- **TrendingUp Icon**: Positive change
- **TrendingDown Icon**: Negative change
- **Green Text**: Gains
- **Red Text**: Losses
- **Percentage**: Change percentage

## 🔄 Data Flow

### **Real-time Flow**
```
1. Component loads →
2. Fetches data from multiple APIs →
3. Displays live prices →
4. Auto-refresh every 30 seconds
```

### **Error Handling**
```
1. Try Alpha Vantage API →
2. Try Metals-API →
3. If both fail, use mock data →
4. Show error message if needed
```

## 🎯 Usage Examples

### **Dashboard Integration**
The TradingWindow is automatically integrated at the top of the dashboard:

```typescript
// In Dashboard.tsx
<TradingWindow />
```

### **Real-time Updates**
- **Auto-refresh**: Every 30 seconds
- **Manual refresh**: Click refresh button
- **Status updates**: Live indicators
- **Error recovery**: Automatic retry

### **Responsive Design**
- **Desktop**: 5 columns grid layout
- **Tablet**: 2-3 columns layout
- **Mobile**: Single column layout
- **Touch-friendly**: Large touch targets

## 🚨 Troubleshooting

### **Common Issues**

#### **1. "No trading data available"**
**Problem**: Component shows no data
**Solutions**:
- Check API keys in `.env.local`
- Verify internet connection
- Check API rate limits
- Restart development server

#### **2. "API Error" Status**
**Problem**: Red status dot shown
**Solutions**:
- Verify API keys are valid
- Check API quotas
- Try manual refresh
- Check console for errors

#### **3. Mock Data Showing**
**Problem**: Shows mock data instead of real data
**Solutions**:
- Configure API keys
- Check API endpoints
- Verify network connectivity
- Check API documentation

### **API Rate Limits**
- **Alpha Vantage**: 5 requests/minute (free tier)
- **Metals-API**: 100 requests/month (free tier)
- **Solution**: Upgrade to paid plans for higher limits

## 🎉 Benefits

### **For Users**
- ✅ **Live Market Data**: Real-time Indian market prices
- ✅ **Quick Overview**: All key assets in one place
- ✅ **Professional Display**: Clean, trading-style interface
- ✅ **Auto-updates**: Fresh data every 30 seconds
- ✅ **Mobile Friendly**: Works on all devices

### **For Developers**
- ✅ **Easy Integration**: Simple component import
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Error Handling**: Robust fallback systems
- ✅ **Responsive Design**: Works on all screen sizes
- ✅ **Customizable**: Easy to modify and extend

## 🔮 Future Enhancements

### **Planned Features**
- **More Stocks**: Additional Indian stocks
- **Forex Data**: Currency pairs
- **Crypto Prices**: Bitcoin, Ethereum
- **Market Hours**: Time-based updates
- **Alerts**: Price change notifications
- **Charts**: Mini price charts

### **API Improvements**
- **WebSocket**: Real-time streaming
- **Caching**: Local data caching
- **Batch Requests**: Efficient API usage
- **Rate Limiting**: Smart API management

## 🎉 Result

The TradingWindow component now provides **professional-grade trading data** that:

- 📈 **Shows live Indian market data**
- 🔄 **Auto-refreshes every 30 seconds**
- 🎨 **Professional trading interface**
- 📱 **Works perfectly on all devices**
- 🛡️ **Handles errors gracefully**
- ⚡ **Fast and responsive**

Users can now see **live trading data** for BSE, Nifty, TCS, Infosys, and Gold prices right at the top of their dashboard! 🎉
