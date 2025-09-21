# 🔥 Metals-API Setup Guide for LiveMetalPrices Component

## 🎯 Overview
The `LiveMetalPrices.tsx` component fetches **real-time metals data** from Metals-API (https://metals-api.com/) and displays live prices for Gold, Silver, Platinum, and Palladium in the selected country's currency.

## 🚀 Features

### **🌍 Country Selection**
- **12 Major Markets**: US, India, Japan, UK, Germany, Canada, Australia, China, Brazil, Russia, South Korea, Mexico
- **Real-time Currency Conversion**: Prices displayed in local currency
- **Visual Country Picker**: Flag icons with country names

### **📊 Real-Time Data**
- **Metals-API Integration**: Direct API calls to https://metals-api.com/
- **Live Prices**: Gold (XAU), Silver (XAG), Platinum (XPT), Palladium (XPD)
- **Auto-refresh**: Every 60 seconds
- **Manual Refresh**: Click refresh button

### **🎨 Professional UI**
- **Responsive Table**: Clean layout with metal icons
- **Loading States**: Spinner while fetching data
- **Error Handling**: Clear error messages with fallback data
- **Data Source Indicators**: Shows "Live Data" or "Demo Data"

## 🔧 Setup Instructions

### **1. Get Metals-API Key**

#### **Step 1: Sign Up**
1. Go to https://metals-api.com/
2. Click "Get Free API Key"
3. Sign up with your email address
4. Verify your email

#### **Step 2: Get Your API Key**
1. Log in to your Metals-API dashboard
2. Copy your API key from the dashboard
3. Note: Free tier includes 100 requests/month

### **2. Configure Environment Variables**

#### **Create `.env.local` file**
Create `.env.local` in your project root directory:

```bash
# Metals-API Configuration
NEXT_PUBLIC_METALS_API_KEY=your_actual_api_key_here
```

#### **Example**
```bash
NEXT_PUBLIC_METALS_API_KEY=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

### **3. Restart Development Server**

After adding the environment variable:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## 📊 API Usage

### **Metals-API Endpoint**
The component uses the following endpoint:
```
https://metals-api.com/api/latest?access_key={API_KEY}&base={CURRENCY}&symbols=XAU,XAG,XPT,XPD
```

### **Parameters**
- `access_key`: Your Metals-API key
- `base`: Currency code (USD, EUR, GBP, etc.)
- `symbols`: Metal symbols (XAU=Gold, XAG=Silver, XPT=Platinum, XPD=Palladium)

### **Response Format**
```json
{
  "success": true,
  "timestamp": 1642234567,
  "base": "USD",
  "date": "2024-01-15",
  "rates": {
    "XAU": 0.000425,
    "XAG": 0.0351,
    "XPT": 0.000976,
    "XPD": 0.000351
  }
}
```

## 🎨 Component Features

### **Country Selection**
- **Dropdown Menu**: Clean, searchable country list
- **Visual Indicators**: Country flags and currency codes
- **Active State**: Highlighted selected country
- **Responsive Design**: Works on all screen sizes

### **Data Display**
- **Table Layout**: Professional table with metal icons
- **Price Formatting**: Proper currency symbols and decimal places
- **Change Indicators**: Color-coded price changes with trend arrows
- **Source Labels**: Shows data source (Metals-API or Fallback)

### **Status Indicators**
- **Live Status**: Green dot for real-time data
- **Demo Status**: Orange dot for fallback data
- **Last Updated**: Timestamp of latest data refresh
- **Currency Display**: Shows current currency in footer

## 🔄 Data Flow

### **Real-Time Flow**
```
1. User selects country →
2. Component fetches metals data from Metals-API →
3. Data converted to local currency →
4. Displayed in responsive table →
5. Auto-refresh every 60 seconds
```

### **Error Handling**
```
1. Try Metals-API →
2. If fails, show error message →
3. Clear data and show "No data available" →
4. Display "API Error" indicator →
5. Continue auto-refresh attempts
```

## 🎯 Usage Examples

### **For Indian Users**
1. Select 🇮🇳 India from dropdown
2. See Gold price in ₹ (Indian Rupees)
3. See Silver price in ₹/oz
4. All prices automatically converted to INR

### **For Japanese Users**
1. Select 🇯🇵 Japan from dropdown
2. See Platinum price in ¥ (Japanese Yen)
3. See Palladium price in ¥/oz
4. All prices automatically converted to JPY

### **For European Users**
1. Select 🇩🇪 Germany from dropdown
2. See metals prices in € (Euros)
3. All prices automatically converted to EUR
4. Professional European market display

## 🚨 Troubleshooting

### **Common Issues**

#### **1. "API key not configured" Error**
**Problem**: Component shows "Demo data - API key needed"
**Solution**: 
- Check `.env.local` file exists
- Verify `NEXT_PUBLIC_METALS_API_KEY` is set
- Restart development server

#### **2. "Metals-API HTTP error"**
**Problem**: API returns HTTP error
**Solutions**:
- Check API key is valid
- Verify you haven't exceeded rate limits
- Check internet connection
- Try manual refresh

#### **3. "No metals data received"**
**Problem**: API returns empty data
**Solutions**:
- Check API key permissions
- Verify currency code is supported
- Check Metals-API status page
- Contact Metals-API support

### **Rate Limits**
- **Free Tier**: 100 requests/month
- **Auto-refresh**: Every 60 seconds = ~43,200 requests/month
- **Solution**: Upgrade to paid plan or reduce refresh frequency

## 🎉 Benefits

### **For Users**
- ✅ **Real-time Data**: Live metals prices from professional API
- ✅ **Global Coverage**: 12 countries with local currencies
- ✅ **Professional Display**: Clean table with proper formatting
- ✅ **Reliable Service**: Robust error handling with fallbacks
- ✅ **Auto-updates**: Fresh data every 60 seconds

### **For Developers**
- ✅ **Easy Integration**: Simple component import
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Error Handling**: Graceful fallback systems
- ✅ **Responsive Design**: Works on all devices
- ✅ **Customizable**: Easy to modify and extend

## 🔮 Future Enhancements

### **Planned Features**
- **Historical Data**: Price charts and trends
- **More Metals**: Additional precious metals
- **Alerts**: Price change notifications
- **Portfolio Tracking**: Multi-currency portfolio
- **Market Hours**: Time-based data updates

### **API Improvements**
- **Caching**: Local data caching for better performance
- **WebSocket**: Real-time price streaming
- **Batch Requests**: Efficient multi-currency fetching
- **Rate Limiting**: Smart API usage optimization

## 🎉 Result

The LiveMetalPrices component now provides **professional-grade real-time metals data** that:

- 🔥 **Fetches live data from Metals-API**
- 🌍 **Supports 12 countries with local currencies**
- 🔄 **Auto-refreshes every 60 seconds**
- 🛡️ **Handles errors gracefully with fallbacks**
- 📱 **Works perfectly on all devices**
- 🎨 **Provides professional table display**
- 💱 **Uses real-time currency conversion**

Users can now see **live metals prices** in their preferred currency with professional-grade data from Metals-API!
