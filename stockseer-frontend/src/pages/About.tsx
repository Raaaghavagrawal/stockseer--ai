import AboutStockSeerTab from '../components/tabs/AboutStockSeerTab';

export default function About() {
  return (
    <div className="min-h-screen bg-white dark:bg-binance-gray-dark text-gray-900 dark:text-white">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-binance-yellow/30 via-binance-yellow-dark/20 to-transparent dark:from-binance-yellow/15 dark:via-binance-yellow-dark/10" />
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-br from-yellow-400/40 to-orange-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="inline-flex items-center px-4 py-2 bg-binance-yellow/15 dark:bg-binance-yellow/20 rounded-full text-binance-yellow-dark dark:text-binance-yellow font-semibold text-sm mb-6">
            <span>About StockSeer.ai</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            Building the future of
            <span className="block bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 bg-clip-text text-transparent"> AI‑Powered Stock Analytics</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-binance-text-secondary max-w-3xl">
            Discover our mission, technology, and the team behind StockSeer.ai.
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="relative">
        {/* Subtle background grid accent */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.08]" style={{backgroundImage: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)", backgroundSize: '32px 32px', color: '#000'}} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Card container to better blend AboutStockSeerTab dark style with landing theme */}
          <div className="rounded-2xl border border-gray-200 dark:border-binance-gray overflow-hidden shadow-lg bg-white/70 dark:bg-binance-gray">
            <div className="bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-purple-500/10 dark:from-yellow-500/10 dark:via-orange-500/10 dark:to-purple-500/10 h-2" />
            <div className="p-4 sm:p-6 lg:p-8">
              <AboutStockSeerTab />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
