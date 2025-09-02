import React, { useState, useEffect } from 'react';
  import { Building2, Users, Globe, TrendingUp, Calendar, DollarSign, BarChart3, MapPin } from 'lucide-react';
import type { StockData } from '../../types/stock';

interface AboutCompanyTabProps {
  selectedStock: string;
  stockData: StockData | null;
}

export default function AboutCompanyTab({ selectedStock, stockData }: AboutCompanyTabProps) {
  const [companyInfo, setCompanyInfo] = useState<any>(null);

  const fetchCompanyInfo = async () => {
    if (!selectedStock) return;
    
    try {
      const response = await fetch(`http://localhost:8000/stocks/${selectedStock}/info`);
      if (response.ok) {
        const data = await response.json();
        // Extract CEO from company officers
        const ceoOfficer = data.companyOfficers?.find((officer: any) => 
          officer.title?.toLowerCase().includes('ceo') || 
          officer.title?.toLowerCase().includes('chief executive')
        );
        
        setCompanyInfo({
          name: data.name || data.shortName || selectedStock,
          description: data.longBusinessSummary || data.description || 'No description available.',
          founded: data.founded || (data.full_info?.longBusinessSummary?.includes('founded in') ? 
            data.full_info.longBusinessSummary.match(/founded in (\d{4})/)?.[1] : 'N/A'),
          headquarters: data.city && data.country ? `${data.city}, ${data.country}` : 
            (data.city ? data.city : 'N/A'),
          employees: data.full_info?.fullTimeEmployees ? 
            `${data.full_info.fullTimeEmployees.toLocaleString()}` : 
            (data.employees ? `${data.employees.toLocaleString()}` : 'N/A'),
          industry: data.industry || 'N/A',
          sector: data.sector || 'N/A',
          website: data.website || '',
          ceo: ceoOfficer?.name || data.ceo || 'N/A',
          revenue: data.totalRevenue ? `${data.currency_symbol || '₹'}${(data.totalRevenue / 1e9).toFixed(1)}B` : 'N/A',
          marketCap: data.marketCap ? `${data.currency_symbol || '₹'}${(data.marketCap / 1e9).toFixed(1)}B` : 'N/A',
          competitors: data.competitors || [],
          products: data.products || [],
          companyHistory: data.company_history || [],
          keyMetrics: {
            peRatio: data.trailingPE || 0,
            dividendYield: data.dividendYield ? (data.dividendYield * 100) : 0,
            debtToEquity: data.debtToEquity || 0,
            returnOnEquity: data.returnOnEquity || 0
          }
        });
      } else {
        console.error('Failed to fetch company info');
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
    }
  };

  useEffect(() => {
    if (selectedStock) {
      fetchCompanyInfo();
    }
  }, [selectedStock]);

  if (!selectedStock) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>Search for a stock to view company information</p>
      </div>
    );
  }

  if (!companyInfo) {
    return (
      <div className="text-center py-12 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Loading company information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-2">🏢 Company Overview</h2>
        <p className="text-slate-400">Comprehensive information about {companyInfo.name}</p>
      </div>

      {/* Company Description */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">About {companyInfo.name}</h3>
        <p className="text-slate-300 leading-relaxed">{companyInfo.description}</p>
      </div>

      {/* Key Company Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
          <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <div className="text-lg font-semibold text-white">{companyInfo.founded}</div>
          <div className="text-slate-400 text-sm">Founded</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
          <MapPin className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <div className="text-sm font-semibold text-white">{companyInfo.headquarters}</div>
          <div className="text-slate-400 text-sm">Headquarters</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
          <Users className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <div className="text-lg font-semibold text-white">{companyInfo.employees}</div>
          <div className="text-slate-400 text-sm">Employees</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
          <Globe className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <div className="text-sm font-semibold text-white">{companyInfo.industry}</div>
          <div className="text-slate-400 text-sm">Industry</div>
        </div>
      </div>

      {/* Company Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Company Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">CEO</span>
              <span className="text-white font-medium">{companyInfo.ceo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Sector</span>
              <span className="text-white font-medium">{companyInfo.sector}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Website</span>
              <a 
                href={companyInfo.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Visit Site
              </a>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Financial Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Revenue</span>
              <span className="text-white font-medium">{companyInfo.revenue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Market Cap</span>
              <span className="text-white font-medium">{companyInfo.marketCap}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">P/E Ratio</span>
              <span className="text-white font-medium">{companyInfo.keyMetrics.peRatio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Dividend Yield</span>
              <span className="text-white font-medium">{companyInfo.keyMetrics.dividendYield}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Products & Services */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Products & Services</h3>
        {companyInfo.products && companyInfo.products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {companyInfo.products.map((product: string, index: number) => (
              <div key={index} className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <div className="text-white font-medium">{product}</div>
                <div className="text-slate-400 text-sm">Core Product</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-400">
            <p className="mb-3">Based on the company's business description, {companyInfo.name} operates in the following areas:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <div className="text-white font-medium">Core Business</div>
                <div className="text-slate-400 text-sm mt-2">{companyInfo.industry}</div>
              </div>
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <div className="text-white font-medium">Sector</div>
                <div className="text-slate-400 text-sm mt-2">{companyInfo.sector}</div>
              </div>
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <div className="text-white font-medium">Market Focus</div>
                <div className="text-slate-400 text-sm mt-2">Global Operations</div>
              </div>
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <div className="text-white font-medium">Business Model</div>
                <div className="text-slate-400 text-sm mt-2">Manufacturing & Distribution</div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
              <h4 className="text-white font-medium mb-2">Business Description</h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                {companyInfo.description.length > 300 
                  ? `${companyInfo.description.substring(0, 300)}...` 
                  : companyInfo.description}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Competitors */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Key Competitors</h3>
        {companyInfo.competitors && companyInfo.competitors.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {companyInfo.competitors.map((competitor: string, index: number) => (
              <span 
                key={index}
                className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm"
              >
                {competitor}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-slate-400">
            <p className="mb-3">Competitive landscape information is not available. However, {companyInfo.name} operates in the {companyInfo.industry} industry within the {companyInfo.sector} sector.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <div className="text-white font-medium">Industry</div>
                <div className="text-slate-400 text-sm mt-1">{companyInfo.industry}</div>
              </div>
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <div className="text-white font-medium">Sector</div>
                <div className="text-slate-400 text-sm mt-1">{companyInfo.sector}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Key Financial Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 text-center">
            <div className="text-slate-400 text-sm">P/E Ratio</div>
            <div className="text-white font-semibold text-lg">{companyInfo.keyMetrics.peRatio}</div>
          </div>
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 text-center">
            <div className="text-slate-400 text-sm">Dividend Yield</div>
            <div className="text-white font-semibold text-lg">{companyInfo.keyMetrics.dividendYield}%</div>
          </div>
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 text-center">
            <div className="text-slate-400 text-sm">Debt/Equity</div>
            <div className="text-white font-semibold text-lg">{companyInfo.keyMetrics.debtToEquity}</div>
          </div>
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 text-center">
            <div className="text-slate-400 text-sm">ROE</div>
            <div className="text-white font-semibold text-lg">{companyInfo.keyMetrics.returnOnEquity}%</div>
          </div>
        </div>
      </div>

      {/* Company History */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Company History & Milestones</h3>
        <div className="space-y-4">
          {companyInfo.companyHistory && companyInfo.companyHistory.length > 0 ? (
            companyInfo.companyHistory.map((historyItem: any, index: number) => (
              <div key={index} className="flex items-start space-x-4">
                <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                  index === 0 ? 'bg-blue-500' :
                  index === 1 ? 'bg-green-500' :
                  index === 2 ? 'bg-purple-500' :
                  index === 3 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
                <div>
                  <div className="text-white font-medium">
                    {historyItem.year} - {historyItem.event}
                  </div>
                  <div className="text-slate-400 text-sm">
                    {historyItem.description}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              {companyInfo.founded && companyInfo.founded !== 'N/A' && (
                <div className="flex items-start space-x-4">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="text-white font-medium">{companyInfo.founded} - Company Founded</div>
                    <div className="text-slate-400 text-sm">
                      {companyInfo.name} was established and began operations in {companyInfo.headquarters}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-start space-x-4">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="text-white font-medium">Current Operations</div>
                  <div className="text-slate-400 text-sm">
                    Operating in the {companyInfo.industry} industry within the {companyInfo.sector} sector
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-3 h-3 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="text-white font-medium">Market Presence</div>
                  <div className="text-slate-400 text-sm">
                    Market cap of {companyInfo.marketCap} with {companyInfo.employees} employees
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="text-white font-medium">Leadership</div>
                  <div className="text-slate-400 text-sm">
                    Led by {companyInfo.ceo} as Chief Executive Officer
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="text-white font-medium">Business Focus</div>
                  <div className="text-slate-400 text-sm">
                    {companyInfo.description.length > 150 
                      ? `${companyInfo.description.substring(0, 150)}...` 
                      : companyInfo.description}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
