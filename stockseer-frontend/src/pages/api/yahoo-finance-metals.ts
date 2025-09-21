// Mock API endpoint for Yahoo Finance metals data
// In production, this would be a server-side endpoint that scrapes Yahoo Finance

import { NextApiRequest, NextApiResponse } from 'next';

interface MetalData {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  change24h: number;
  changePercent24h: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { symbols } = req.body;

    // Simulate Yahoo Finance scraping with realistic data
    const metalsData: MetalData[] = symbols.map((symbol: string) => {
      const basePrices = {
        XAU: 2347.85, // Gold
        XAG: 28.45,   // Silver
        XPT: 1024.30, // Platinum
        XPD: 2847.50  // Palladium
      };

      const names = {
        XAU: 'Gold',
        XAG: 'Silver',
        XPT: 'Platinum',
        XPD: 'Palladium'
      };

      const basePrice = basePrices[symbol as keyof typeof basePrices] || 1000;
      const changePercent24h = (Math.random() - 0.5) * 4; // Random change between -2% and +2%
      const change24h = basePrice * (changePercent24h / 100);

      return {
        symbol,
        name: names[symbol as keyof typeof names] || symbol,
        price: basePrice + (Math.random() - 0.5) * 50, // Add some variation
        currency: 'USD',
        change24h,
        changePercent24h,
      };
    });

    res.status(200).json({ metals: metalsData });
  } catch (error) {
    console.error('Yahoo Finance API error:', error);
    res.status(500).json({ error: 'Failed to fetch metals data' });
  }
}
