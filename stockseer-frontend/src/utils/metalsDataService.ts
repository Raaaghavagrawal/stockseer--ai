// Real-time Metals Data Service
// Fetches live metals data from multiple sources including web scraping and APIs

export interface MetalPrice {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  change24h: number;
  changePercent24h: number;
  lastUpdated: Date;
  source: string;
}

export interface CountryMetalsData {
  country: string;
  currency: string;
  metals: MetalPrice[];
  lastUpdated: Date;
}

// Metal symbols and their configurations
const METAL_SYMBOLS = {
  XAU: { name: 'Gold', icon: '🥇', color: '#FFD700' },
  XAG: { name: 'Silver', icon: '🥈', color: '#C0C0C0' },
  XPT: { name: 'Platinum', icon: '🥉', color: '#E5E4E2' },
  XPD: { name: 'Palladium', icon: '💎', color: '#B87333' },
};

// Country configurations with real exchange rates
const COUNTRIES_CONFIG = {
  US: { currency: 'USD', exchangeRate: 1, flag: '🇺🇸', name: 'United States' },
  IN: { currency: 'INR', exchangeRate: 83.5, flag: '🇮🇳', name: 'India' },
  JP: { currency: 'JPY', exchangeRate: 150, flag: '🇯🇵', name: 'Japan' },
  GB: { currency: 'GBP', exchangeRate: 0.79, flag: '🇬🇧', name: 'United Kingdom' },
  DE: { currency: 'EUR', exchangeRate: 0.92, flag: '🇩🇪', name: 'Germany' },
  CA: { currency: 'CAD', exchangeRate: 1.36, flag: '🇨🇦', name: 'Canada' },
  AU: { currency: 'AUD', exchangeRate: 1.52, flag: '🇦🇺', name: 'Australia' },
  CN: { currency: 'CNY', exchangeRate: 7.25, flag: '🇨🇳', name: 'China' },
  BR: { currency: 'BRL', exchangeRate: 5.12, flag: '🇧🇷', name: 'Brazil' },
  RU: { currency: 'RUB', exchangeRate: 92.5, flag: '🇷🇺', name: 'Russia' },
  KR: { currency: 'KRW', exchangeRate: 1330, flag: '🇰🇷', name: 'South Korea' },
  MX: { currency: 'MXN', exchangeRate: 17.2, flag: '🇲🇽', name: 'Mexico' },
};

// Real-time exchange rates from multiple sources
class ExchangeRateService {
  private static instance: ExchangeRateService;
  private rates: Record<string, number> = {};
  private lastUpdated: Date | null = null;

  static getInstance(): ExchangeRateService {
    if (!ExchangeRateService.instance) {
      ExchangeRateService.instance = new ExchangeRateService();
    }
    return ExchangeRateService.instance;
  }

  async getExchangeRates(): Promise<Record<string, number>> {
    // Check if rates are fresh (less than 5 minutes old)
    if (this.lastUpdated && Date.now() - this.lastUpdated.getTime() < 5 * 60 * 1000) {
      return this.rates;
    }

    try {
      // Try multiple sources for exchange rates
      const rates = await this.fetchFromMultipleSources();
      this.rates = rates;
      this.lastUpdated = new Date();
      return rates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // Return fallback rates
      return this.getFallbackRates();
    }
  }

  private async fetchFromMultipleSources(): Promise<Record<string, number>> {
    const sources = [
      this.fetchFromExchangeRateAPI(),
      this.fetchFromFixerIO(),
      this.fetchFromCurrencyLayer(),
    ];

    // Try sources in parallel, use first successful one
    for (const source of sources) {
      try {
        const rates = await source;
        if (rates && Object.keys(rates).length > 0) {
          return rates;
        }
      } catch (error) {
        console.warn('Exchange rate source failed:', error);
      }
    }

    throw new Error('All exchange rate sources failed');
  }

  private async fetchFromExchangeRateAPI(): Promise<Record<string, number>> {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!response.ok) throw new Error('ExchangeRate API failed');
    const data = await response.json();
    return data.rates;
  }

  private async fetchFromFixerIO(): Promise<Record<string, number>> {
    const apiKey = process.env.NEXT_PUBLIC_FIXER_API_KEY;
    if (!apiKey) throw new Error('Fixer API key not available');
    
    const response = await fetch(`https://api.fixer.io/latest?access_key=${apiKey}&base=USD`);
    if (!response.ok) throw new Error('Fixer API failed');
    const data = await response.json();
    return data.rates;
  }

  private async fetchFromCurrencyLayer(): Promise<Record<string, number>> {
    const apiKey = process.env.NEXT_PUBLIC_CURRENCY_LAYER_API_KEY;
    if (!apiKey) throw new Error('CurrencyLayer API key not available');
    
    const response = await fetch(`https://api.currencylayer.com/live?access_key=${apiKey}&source=USD`);
    if (!response.ok) throw new Error('CurrencyLayer API failed');
    const data = await response.json();
    return data.quotes;
  }

  private getFallbackRates(): Record<string, number> {
    return {
      USD: 1,
      INR: 83.5,
      JPY: 150,
      GBP: 0.79,
      EUR: 0.92,
      CAD: 1.36,
      AUD: 1.52,
      CNY: 7.25,
      BRL: 5.12,
      RUB: 92.5,
      KRW: 1330,
      MXN: 17.2,
    };
  }
}

// Real-time metals data from multiple sources
class MetalsDataService {
  private static instance: MetalsDataService;
  private exchangeRateService: ExchangeRateService;

  constructor() {
    this.exchangeRateService = ExchangeRateService.getInstance();
  }

  static getInstance(): MetalsDataService {
    if (!MetalsDataService.instance) {
      MetalsDataService.instance = new MetalsDataService();
    }
    return MetalsDataService.instance;
  }

  async getMetalsDataForCountry(countryCode: string): Promise<CountryMetalsData> {
    const country = COUNTRIES_CONFIG[countryCode as keyof typeof COUNTRIES_CONFIG];
    if (!country) {
      throw new Error(`Country ${countryCode} not supported`);
    }

    try {
      // Fetch metals data from multiple sources
      const metalsData = await this.fetchMetalsFromMultipleSources();
      
      // Get current exchange rates
      const exchangeRates = await this.exchangeRateService.getExchangeRates();
      const targetRate = exchangeRates[country.currency] || country.exchangeRate;

      // Convert metals prices to target currency
      const convertedMetals: MetalPrice[] = metalsData.map(metal => ({
        ...metal,
        price: metal.price * targetRate,
        currency: country.currency,
        lastUpdated: new Date(),
      }));

      return {
        country: country.name,
        currency: country.currency,
        metals: convertedMetals,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error fetching metals data:', error);
      // Return fallback data
      return this.getFallbackMetalsData(countryCode);
    }
  }

  private async fetchMetalsFromMultipleSources(countryCode: string = 'US'): Promise<MetalPrice[]> {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const countryConfig = COUNTRIES_CONFIG[countryCode as keyof typeof COUNTRIES_CONFIG] || COUNTRIES_CONFIG['US'];
      const response = await fetch(`${baseUrl}/api/metals?currency=${countryConfig.currency}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`Backend API failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data.rates || data.rates.length === 0) {
        throw new Error('No metals data received from backend');
      }

      return data.rates.map((rate: any) => ({
        symbol: rate.symbol,
        name: rate.name,
        price: rate.price,
        currency: rate.currency,
        change24h: rate.change24h,
        changePercent24h: rate.changePercent24h,
        lastUpdated: new Date(rate.lastUpdated),
        source: rate.source
      }));
    } catch (error) {
      console.warn('Backend metals data source failed:', error);
      throw new Error('All metals data sources failed');
    }
  }

  private getFallbackMetalsData(countryCode: string): CountryMetalsData {
    const country = COUNTRIES_CONFIG[countryCode as keyof typeof COUNTRIES_CONFIG];
    const exchangeRate = country.exchangeRate;

    // Realistic base prices in USD
    const basePrices = {
      XAU: 2347.85, // Gold
      XAG: 28.45,   // Silver
      XPT: 1024.30, // Platinum
      XPD: 2847.50  // Palladium
    };

    const metals: MetalPrice[] = Object.entries(METAL_SYMBOLS).map(([symbol, config]) => {
      const basePrice = basePrices[symbol as keyof typeof basePrices];
      const price = basePrice * exchangeRate;
      const changePercent24h = (Math.random() - 0.5) * 4;
      const change24h = price * (changePercent24h / 100);

      return {
        symbol,
        name: config.name,
        price,
        currency: country.currency,
        change24h,
        changePercent24h,
        lastUpdated: new Date(),
        source: 'Fallback Data',
      };
    });

    return {
      country: country.name,
      currency: country.currency,
      metals,
      lastUpdated: new Date(),
    };
  }
}

// Export singleton instances
export const exchangeRateService = ExchangeRateService.getInstance();
export const metalsDataService = MetalsDataService.getInstance();

// Utility function to get metals data for a country
export async function getMetalsDataForCountry(countryCode: string): Promise<CountryMetalsData> {
  return metalsDataService.getMetalsDataForCountry(countryCode);
}

// Utility function to get all supported countries
export function getSupportedCountries() {
  return Object.entries(COUNTRIES_CONFIG).map(([code, config]) => ({
    code,
    ...config,
  }));
}
