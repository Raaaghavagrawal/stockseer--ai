def render_about_tab():
    """Render the About tab content for FastAPI."""
    return {
        "title": "About StockSeer.AI",
        "content": {
            "mission": {
                "title": "🚀 Our Mission",
                "description": "StockSeer.AI is dedicated to democratizing sophisticated stock analysis by providing institutional-grade tools and insights to individual investors. We combine cutting-edge artificial intelligence with comprehensive financial data to help you make informed investment decisions."
            },
            "features": {
                "title": "✨ Key Features",
                "items": [
                    {
                        "title": "🧠 AI-Powered Analysis",
                        "description": "Advanced machine learning algorithms provide intelligent insights and predictions"
                    },
                    {
                        "title": "📊 Technical Indicators",
                        "description": "Comprehensive technical analysis with 20+ advanced indicators"
                    },
                    {
                        "title": "📈 Risk Assessment",
                        "description": "Monte Carlo simulations and advanced risk metrics"
                    },
                    {
                        "title": "🌍 Global Coverage",
                        "description": "Support for multiple markets including US, Indian, and international stocks"
                    },
                    {
                        "title": "⚡ Real-Time Data",
                        "description": "Live market data and real-time portfolio tracking"
                    },
                    {
                        "title": "🛡️ Security First",
                        "description": "Enterprise-grade security and data protection"
                    }
                ]
            },
            "technology": {
                "title": "🛠️ Technology Stack",
                "frontend": [
                    "React 18 with TypeScript",
                    "Tailwind CSS for styling",
                    "Recharts for data visualization",
                    "Shadcn/ui component library"
                ],
                "backend": [
                    "FastAPI with Python",
                    "Pandas for data manipulation",
                    "yfinance for market data",
                    "Technical analysis library"
                ]
            },
            "data_sources": {
                "title": "📊 Data Sources",
                "market_data": "Real-time stock prices, volume, and market information",
                "financial_data": "Earnings, balance sheets, and financial ratios",
                "news_sentiment": "Market news and AI-powered sentiment analysis"
            },
            "roadmap": {
                "title": "🗺️ Development Roadmap",
                "phases": [
                    {
                        "title": "Phase 1 - Core Platform ✅",
                        "description": "Basic stock analysis, technical indicators, and portfolio management"
                    },
                    {
                        "title": "Phase 2 - Advanced Features 🚧",
                        "description": "AI-powered insights, advanced risk metrics, and social features"
                    },
                    {
                        "title": "Phase 3 - Enterprise 🔮",
                        "description": "Institutional tools, API access, and advanced analytics"
                    }
                ]
            },
            "team": {
                "title": "👥 Our Team",
                "description": "StockSeer.AI is built by a team of passionate developers, data scientists, and financial experts who believe in making sophisticated investment tools accessible to everyone.",
                "development_team": "Experienced software engineers specializing in React, Python, and financial applications",
                "financial_experts": "Certified financial analysts and investment professionals providing domain expertise"
            },
            "contact": {
                "title": "📞 Contact & Support",
                "email": "support@stockseer.ai",
                "documentation": "docs.stockseer.ai",
                "github": "github.com/stockseer-ai",
                "support": [
                    "User Guide & Tutorials",
                    "FAQ & Troubleshooting",
                    "Community Forum"
                ]
            },
            "disclaimers": {
                "title": "📋 Important Disclaimers",
                "investment_risk": "StockSeer.AI is a financial analysis platform and does not provide investment advice. All investments carry risk, including the potential loss of principal.",
                "data_accuracy": "While we strive for accuracy, financial data may have delays or inaccuracies. Always verify information with official sources.",
                "professional_advice": "Consult with qualified financial professionals before making investment decisions. Past performance does not guarantee future results."
            },
            "metrics": {
                "stocks_tracked": "10,000+",
                "ai_models": "50+",
                "accuracy_rate": "85%"
            }
        }
    }
