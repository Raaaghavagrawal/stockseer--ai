import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Info, 
  Zap,
  Shield,
  TrendingUp,
  BarChart3,
  Brain,
  Globe,
  Users,
  Star,
  CheckCircle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export default function AboutStockSeerTab() {
  return (
    <React.Fragment>
      <div className="space-y-6">
      {/* Header */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl text-white">
            StockSeer.AI
          </CardTitle>
          <CardDescription className="text-xl text-slate-300">
            Your Intelligent Stock Analysis Platform
          </CardDescription>
          <div className="mt-4">
            <Badge className="bg-green-600 text-white">
              Version 1.0.0
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Mission Statement */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">🚀 Our Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-300 text-lg leading-relaxed">
            StockSeer.AI is dedicated to democratizing sophisticated stock analysis by providing 
            institutional-grade tools and insights to individual investors. We combine cutting-edge 
            artificial intelligence with comprehensive financial data to help you make informed 
            investment decisions.
          </p>
        </CardContent>
      </Card>

      <Separator className="bg-slate-700" />

      {/* Key Features */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">✨ Key Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-blue-400" />
                </div>
                <h4 className="font-semibold text-white">AI-Powered Analysis</h4>
              </div>
              <p className="text-slate-300 text-sm">
                Advanced machine learning algorithms provide intelligent insights and predictions
              </p>
            </div>

            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                </div>
                <h4 className="font-semibold text-white">Technical Indicators</h4>
              </div>
              <p className="text-slate-300 text-sm">
                Comprehensive technical analysis with 20+ advanced indicators
              </p>
            </div>

            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <h4 className="font-semibold text-white">Risk Assessment</h4>
              </div>
              <p className="text-slate-300 text-sm">
                Monte Carlo simulations and advanced risk metrics
              </p>
            </div>

            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-yellow-400" />
                </div>
                <h4 className="font-semibold text-white">Global Coverage</h4>
              </div>
              <p className="text-slate-300 text-sm">
                Support for multiple markets including US, Indian, and international stocks
              </p>
            </div>

            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-red-400" />
                </div>
                <h4 className="font-semibold text-white">Real-Time Data</h4>
              </div>
              <p className="text-slate-300 text-sm">
                Live market data and real-time portfolio tracking
              </p>
            </div>

            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <h4 className="font-semibold text-white">Security First</h4>
              </div>
              <p className="text-slate-300 text-sm">
                Enterprise-grade security and data protection
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technology Stack */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">🛠️ Technology Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-3">Frontend</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">React 18 with TypeScript</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">Tailwind CSS for styling</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">Recharts for data visualization</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">Shadcn/ui component library</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Backend</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">FastAPI with Python</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">Pandas for data manipulation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">yfinance for market data</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">Technical analysis library</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">📊 Data Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-700/50 rounded-lg text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <h4 className="font-semibold text-white mb-2">Market Data</h4>
              <p className="text-slate-300 text-sm">
                Real-time stock prices, volume, and market information
              </p>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-green-400" />
              </div>
              <h4 className="font-semibold text-white mb-2">Financial Data</h4>
              <p className="text-slate-300 text-sm">
                Earnings, balance sheets, and financial ratios
              </p>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Globe className="w-6 h-6 text-purple-400" />
              </div>
              <h4 className="font-semibold text-white mb-2">News & Sentiment</h4>
              <p className="text-slate-300 text-sm">
                Market news and AI-powered sentiment analysis
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roadmap */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">🗺️ Development Roadmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Phase 1 - Core Platform</h4>
                <p className="text-slate-300 text-sm">
                  Basic stock analysis, technical indicators, and portfolio management
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Phase 2 - Advanced Features</h4>
                <p className="text-slate-300 text-sm">
                  AI-powered insights, advanced risk metrics, and social features
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Phase 3 - Enterprise</h4>
                <p className="text-slate-300 text-sm">
                  Institutional tools, API access, and advanced analytics
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Story */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">📖 Our Story</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-300 text-lg leading-relaxed mb-4">
            StockSeer.AI was born from a simple yet powerful vision: to democratize sophisticated financial 
            analysis and make institutional-grade investment tools accessible to individual investors worldwide. 
            Founded in 2024 by two passionate entrepreneurs, our platform combines cutting-edge artificial 
            intelligence with comprehensive market data to empower investors with actionable insights.
          </p>
          <p className="text-slate-300 text-lg leading-relaxed">
            We believe that every investor, regardless of their experience level, deserves access to the same 
            quality of analysis that institutional investors use. Our mission is to level the playing field 
            and help individuals make more informed, data-driven investment decisions.
          </p>
        </CardContent>
      </Card>

      {/* Founders */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-blue-400" />
            <CardTitle className="text-white">👥 Meet Our Founders</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Ranijay Singh */}
            <div className="p-6 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl border border-slate-600">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">RS</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">Ranijay Singh</h4>
                  <p className="text-blue-400 font-semibold">Co-Founder & CEO</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Ranijay brings extensive experience in financial technology and product development. 
                With a background in computer science and a passion for fintech innovation, he leads 
                the strategic vision and product roadmap for StockSeer.AI.
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300 text-sm">Product Strategy & Vision</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300 text-sm">Financial Technology Expertise</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300 text-sm">Business Development</span>
                </div>
              </div>
            </div>

            {/* Raghav Agrawal */}
            <div className="p-6 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl border border-slate-600">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">RA</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">Raghav Agrawal</h4>
                  <p className="text-green-400 font-semibold">Co-Founder & CTO</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                Raghav is a seasoned software engineer and AI enthusiast with deep expertise in machine learning 
                and financial data analysis. He oversees the technical architecture and leads the development 
                of our AI-powered analytics engine.
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300 text-sm">AI & Machine Learning</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300 text-sm">Full-Stack Development</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300 text-sm">Data Science & Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Values */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">💎 Our Values</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <h4 className="font-semibold text-white">Transparency</h4>
              </div>
              <p className="text-slate-300 text-sm">
                We believe in open, honest communication and transparent pricing with no hidden fees.
              </p>
            </div>

            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <h4 className="font-semibold text-white">Accessibility</h4>
              </div>
              <p className="text-slate-300 text-sm">
                Making sophisticated financial tools accessible to investors of all experience levels.
              </p>
            </div>

            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <h4 className="font-semibold text-white">Innovation</h4>
              </div>
              <p className="text-slate-300 text-sm">
                Continuously pushing the boundaries of what's possible with AI and financial technology.
              </p>
            </div>

            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-400" />
                </div>
                <h4 className="font-semibold text-white">Excellence</h4>
              </div>
              <p className="text-slate-300 text-sm">
                Committed to delivering the highest quality tools and user experience.
              </p>
            </div>

            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-red-400" />
                </div>
                <h4 className="font-semibold text-white">Speed</h4>
              </div>
              <p className="text-slate-300 text-sm">
                Real-time data and lightning-fast analysis to help you stay ahead of the market.
              </p>
            </div>

            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-emerald-400" />
                </div>
                <h4 className="font-semibold text-white">Global Reach</h4>
              </div>
              <p className="text-slate-300 text-sm">
                Serving investors worldwide with support for multiple markets and currencies.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Stats */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">📈 By the Numbers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">10,000+</div>
              <div className="text-slate-300 text-sm">Stocks Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">50+</div>
              <div className="text-slate-300 text-sm">AI Models</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">85%</div>
              <div className="text-slate-300 text-sm">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">24/7</div>
              <div className="text-slate-300 text-sm">Market Coverage</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact & Support */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Info className="w-6 h-6 text-blue-400" />
            <CardTitle className="text-white">📞 Contact & Support</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="font-semibold text-white mb-3">Get in Touch</h4>
              <div className="space-y-2 text-sm text-slate-300">
                <p>• Email: support@stockseer.ai</p>
                <p>• Documentation: docs.stockseer.ai</p>
                <p className="flex items-center space-x-2">
                  <span>• GitHub:</span>
                  <a href="https://github.com/stockseer-ai" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center space-x-1">
                    <span>github.com/stockseer-ai</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="font-semibold text-white mb-3">Support</h4>
              <div className="space-y-2 text-sm text-slate-300">
                <p>• User Guide & Tutorials</p>
                <p>• FAQ & Troubleshooting</p>
                <p>• Community Forum</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">📋 Important Disclaimers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-slate-300">
            <p>
              <strong>Investment Risk:</strong> StockSeer.AI is a financial analysis platform and does not 
              provide investment advice. All investments carry risk, including the potential loss of principal.
            </p>
            <p>
              <strong>Data Accuracy:</strong> While we strive for accuracy, financial data may have delays 
              or inaccuracies. Always verify information with official sources.
            </p>
            <p>
              <strong>Professional Advice:</strong> Consult with qualified financial professionals before 
              making investment decisions. Past performance does not guarantee future results.
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </React.Fragment>
  );
}
