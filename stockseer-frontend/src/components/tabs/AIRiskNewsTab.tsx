import { useLayoutEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, RefreshCw, Shield, TrendingUp } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { StockData } from '../../types/stock';
import { mlAPI, type RiskAnalysisResponse } from '../../utils/api';
import { formatPrice } from '../../utils/currency';

interface AIRiskNewsTabProps {
  selectedStock: string;
  stockData: StockData | null;
}

const periods = ['1y', '2y', '5y'] as const;
const horizons = [1, 5, 20] as const;
const pct = (value: number | null | undefined, digits = 2) => typeof value === 'number' && Number.isFinite(value) ? `${(value * 100).toFixed(digits)}%` : 'Unavailable';
const fixed = (value: number | null | undefined, digits = 2) => typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : 'Unavailable';

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-semibold text-white">{value}</div>
      {note && <div className="mt-1 text-xs text-slate-500">{note}</div>}
    </div>
  );
}

export default function AIRiskNewsTab({ selectedStock, stockData }: AIRiskNewsTabProps) {
  const ticker = selectedStock.trim().toUpperCase();
  const [period, setPeriod] = useState<(typeof periods)[number]>('2y');
  const [horizon, setHorizon] = useState<(typeof horizons)[number]>(5);
  const [refreshKey, setRefreshKey] = useState(0);
  const [analysis, setAnalysis] = useState<RiskAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    let active = true;
    setAnalysis(null);
    setError(null);
    if (!ticker) {
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    mlAPI.getAnalysis(ticker, period, horizon)
      .then((result) => { if (active && result.ticker === ticker) setAnalysis(result); })
      .catch((cause: unknown) => {
        if (!active) return;
        const err = cause as { response?: { data?: { detail?: unknown } }; message?: string };
        const detail = err.response?.data?.detail;
        const message = typeof detail === 'object' && detail !== null && 'message' in detail
          ? String((detail as { message: unknown }).message)
          : typeof detail === 'string' ? detail : err.message;
        setError(message || 'Risk analysis is currently unavailable.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [ticker, period, horizon, refreshKey]);

  const riskColor = useMemo(() => {
    switch (analysis?.classification) {
      case 'Low': return 'text-emerald-300 border-emerald-800 bg-emerald-950/40';
      case 'Moderate': return 'text-lime-300 border-lime-800 bg-lime-950/40';
      case 'Elevated': return 'text-amber-300 border-amber-800 bg-amber-950/40';
      case 'High': return 'text-orange-300 border-orange-800 bg-orange-950/40';
      case 'Very High': return 'text-rose-300 border-rose-800 bg-rose-950/40';
      default: return 'text-slate-300 border-slate-700 bg-slate-900/40';
    }
  }, [analysis?.classification]);

  if (!ticker) {
    return <div className="py-12 text-center text-slate-400">Choose a ticker to load historical risk and model evaluation.</div>;
  }

  const metrics = analysis?.metrics;
  const forecast = analysis?.forecast;
  const quality = analysis?.data_quality;
  const lastPoint = analysis ? analysis.history[analysis.history.length - 1] : undefined;
  const currency = stockData?.currency || 'USD';
  const evaluation = forecast?.evaluation;

  return (
    <div className="w-full space-y-5 text-slate-200">
      <section className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Risk & Forecast Analysis</h2>
          <p className="mt-1 text-sm text-slate-400">Historical OHLCV analytics for {ticker}; forecasts are shown only when walk-forward checks pass.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-slate-400" htmlFor="risk-period">History</label>
          <select id="risk-period" value={period} onChange={(event) => setPeriod(event.target.value as (typeof periods)[number])} className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white">
            {periods.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <label className="ml-1 text-sm text-slate-400" htmlFor="risk-horizon">Forecast</label>
          <select id="risk-horizon" value={horizon} onChange={(event) => setHorizon(Number(event.target.value) as (typeof horizons)[number])} className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white">
            {horizons.map((value) => <option key={value} value={value}>{value} session{value === 1 ? '' : 's'}</option>)}
          </select>
          <button type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading} className="inline-flex items-center gap-2 rounded-md border border-slate-600 px-3 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50" aria-label="Refresh analysis">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </section>

      {loading && <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-5 text-sm text-slate-300">Loading validated market history and risk calculations for {ticker}…</div>}
      {error && <div role="alert" className="rounded-lg border border-rose-800 bg-rose-950/30 p-4 text-sm text-rose-200"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</div>}

      {analysis && analysis.ticker === ticker && !loading && (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className={`rounded-lg border p-4 ${riskColor}`}>
              <div className="flex items-center gap-2 text-sm"><Shield className="h-4 w-4" /> Relative risk rank</div>
              <div className="mt-2 text-3xl font-bold">{analysis.score === null ? '—' : `${analysis.score.toFixed(0)}/100`}</div>
              <div className="mt-1 text-sm">{analysis.classification}</div>
              <div className="mt-2 text-xs opacity-80">Compared with {ticker}'s own {period} history; not a loss probability.</div>
            </div>
            <Metric label="Annualized volatility" value={pct(metrics?.annualized_volatility)} note="Daily standard deviation × √252" />
            <Metric label="Maximum drawdown" value={pct(metrics?.max_drawdown)} note={`${period} adjusted-return series`} />
            <Metric label="Historical VaR 95%" value={pct(metrics?.historical_var_95)} note="Daily historical 5th percentile loss" />
            <Metric label="Historical CVaR 95%" value={pct(metrics?.historical_cvar_95)} note="Mean loss beyond historical VaR" />
          </section>

          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Metric label="Latest analyzed close" value={lastPoint ? formatPrice(lastPoint.close, currency) : 'Unavailable'} note={quality?.latest_observation ? new Date(quality.latest_observation).toLocaleString() : undefined} />
            <Metric label="Sharpe ratio" value={fixed(metrics?.sharpe_ratio)} note="Zero risk-free-rate convention" />
            <Metric label="Sortino ratio" value={fixed(metrics?.sortino_ratio)} note="Annualized downside deviation" />
            <Metric label="Downside deviation" value={pct(metrics?.downside_deviation)} note="Annualized negative-return RMS" />
            <Metric label="Volatility regime" value={fixed(metrics?.short_to_long_volatility_ratio, 2)} note={`${pct(metrics?.short_term_volatility_20d)} 20-session vs ${pct(metrics?.long_term_volatility)} period annualized`} />
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
              <h3 className="mb-1 font-semibold text-white">Risk component ranks</h3>
              <p className="mb-4 text-xs text-slate-400">Each component is the latest 63-session risk measure’s percentile against the ticker’s trailing analysis history. Equal weights are used; score requires all three components.</p>
              <div className="space-y-4">
                {Object.entries(analysis.components).map(([name, component]) => (
                  <div key={name}>
                    <div className="mb-1 flex justify-between gap-2 text-sm"><span className="capitalize">{name.replace(/_/g, ' ')}</span><span>{component.historical_percentile === null ? 'Insufficient history' : `${component.historical_percentile.toFixed(0)}th percentile`}</span></div>
                    <div className="h-2 overflow-hidden rounded bg-slate-700"><div className="h-full rounded bg-sky-500" style={{ width: `${component.historical_percentile ?? 0}%` }} /></div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-400">Method: {analysis.score_interpretation}</p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
              <h3 className="mb-4 font-semibold text-white">Benchmark comparison</h3>
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Benchmark" value={analysis.benchmark.ticker || 'Unavailable'} note={analysis.benchmark.available ? 'Aligned daily returns' : 'No reliable market benchmark available'} />
                <Metric label="Beta" value={fixed(metrics?.beta)} note="Covariance / benchmark variance" />
                <Metric label="Correlation" value={fixed(metrics?.benchmark_correlation)} />
                <Metric label="Relative return" value={pct(metrics?.relative_return)} note="Same aligned observations" />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
            <h3 className="mb-4 font-semibold text-white">20-session rolling volatility</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analysis.history} margin={{ top: 8, right: 12, bottom: 2, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" minTickGap={35} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(date: string) => date.slice(0, 7)} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(value: number) => `${(value * 100).toFixed(0)}%`} />
                  <Tooltip labelFormatter={(date) => String(date)} formatter={(value) => [pct(Number(value)), 'Annualized volatility']} contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                  <Line type="monotone" dataKey="volatility_20d" name="20-session volatility" stroke="#c084fc" dot={false} strokeWidth={2} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
              <h3 className="mb-4 font-semibold text-white">Adjusted price and moving averages</h3>
          <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analysis.history} margin={{ top: 8, right: 12, bottom: 2, left: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" minTickGap={35} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(date: string) => date.slice(0, 7)} />
                    <YAxis domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip labelFormatter={(date) => String(date)} formatter={(value) => [Number(value).toFixed(2), '']} contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                    <Line type="monotone" dataKey="close" name="Close" stroke="#38bdf8" dot={false} strokeWidth={2} connectNulls />
                    <Line type="monotone" dataKey="sma_20" name="SMA 20" stroke="#a78bfa" dot={false} strokeWidth={1.5} connectNulls />
                    <Line type="monotone" dataKey="sma_50" name="SMA 50" stroke="#fbbf24" dot={false} strokeWidth={1.5} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
              <h3 className="mb-4 font-semibold text-white">Drawdown history</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analysis.history} margin={{ top: 8, right: 12, bottom: 2, left: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" minTickGap={35} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(date: string) => date.slice(0, 7)} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(value: number) => `${(value * 100).toFixed(0)}%`} />
                    <Tooltip labelFormatter={(date) => String(date)} formatter={(value) => [pct(Number(value)), 'Drawdown']} contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                    <Line type="monotone" dataKey="drawdown" name="Drawdown" stroke="#fb7185" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-white">Forecast evaluation</h3>
                <span className={`rounded-full border px-3 py-1 text-xs uppercase ${forecast?.status === 'validated' ? 'border-emerald-700 text-emerald-300' : 'border-amber-700 text-amber-300'}`}>{forecast?.status}</span>
              </div>
              <p className="text-sm text-slate-300">{forecast?.reason}</p>
              {forecast?.status === 'validated' && forecast.estimate_price !== null && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Metric label="Estimated return" value={pct(forecast.estimate_return)} note={`${horizon} trading sessions`} />
                  <Metric label="Price scenario" value={formatPrice(forecast.estimate_price, currency)} note={`Reference ${formatPrice(forecast.reference_price || 0, currency)}`} />
                </div>
              )}
              {evaluation ? (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Metric label="Walk-forward model MAE" value={pct(evaluation.mae)} />
                  <Metric label="Zero-return baseline MAE" value={pct(evaluation.baseline_mae)} />
                  <Metric label="Walk-forward RMSE" value={pct(evaluation.rmse)} />
                  <Metric label="Directional accuracy" value={pct(evaluation.directional_accuracy)} note={`${evaluation.samples} chronological test observations`} />
                  <p className="col-span-2 text-xs text-slate-500">{evaluation.method} Test: {evaluation.test_start} to {evaluation.test_end}. No calibrated prediction interval or probability is reported.</p>
                </div>
              ) : <p className="mt-4 text-sm text-slate-400">Insufficient history for a chronological model evaluation. No forecast is provided.</p>}
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
              <h3 className="mb-3 font-semibold text-white">Technical indicators</h3>
              <div className="grid grid-cols-2 gap-3">
                <Metric label="RSI (14)" value={fixed(analysis.indicators.rsi_14, 1)} note="Above 70 elevated; below 30 depressed" />
                <Metric label="MACD / signal" value={`${fixed(analysis.indicators.macd)} / ${fixed(analysis.indicators.macd_signal)}`} note="Computed from selected ticker history" />
                <Metric label="ATR (14)" value={fixed(analysis.indicators.atr_14)} note="Price range measure; not a loss estimate" />
                <Metric label="Volume vs 20-day average" value={analysis.indicators.volume_vs_20d_avg === null ? 'Unavailable' : `${fixed(analysis.indicators.volume_vs_20d_avg)}×`} note="OHLCV proxy; not bid-ask liquidity" />
                <Metric label="Price vs SMA 20" value={pct(analysis.indicators.price_vs_sma20)} />
                <Metric label="Price vs SMA 50" value={pct(analysis.indicators.price_vs_sma50)} />
                <Metric label="Price vs SMA 200" value={pct(analysis.indicators.price_vs_sma200)} />
                <Metric label="20-day annualized volatility" value={lastPoint ? pct(lastPoint.volatility_20d) : 'Unavailable'} />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-white"><Activity className="h-4 w-4" />Model reliability & data quality</h3>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Model" value={forecast?.model || 'Unavailable'} note={forecast?.trained_at ? `Fit ${new Date(forecast.trained_at).toLocaleString()}` : 'No evaluation fit available'} />
              <Metric label="Forecast status" value={forecast?.status || 'Unavailable'} note={forecast?.reason} />
              <Metric label="Provider" value={quality?.source || 'Unavailable'} note="Daily historical data; not a live quote" />
              <Metric label="Data freshness" value={quality?.freshness || 'Unavailable'} note={quality ? `${quality.age_days.toFixed(1)} days since latest observation` : undefined} />
              <Metric label="Observations" value={quality ? String(quality.observations) : 'Unavailable'} note={quality ? `${quality.period_start} to ${quality.period_end}` : undefined} />
              <Metric label="Data checks" value={quality?.validation_status || 'Unavailable'} note={quality ? `${quality.dropped_observations} invalid rows; ${quality.missing_data_count} missing OHLCV fields (${pct(quality.missing_data_ratio)}); ${quality.duplicate_timestamps_removed} duplicate timestamps removed` : undefined} />
              <Metric label="Price basis" value={quality?.uses_adjusted_close ? 'Adjusted close' : 'Close'} note={quality?.adjusted_close_missing ? `${quality.adjusted_close_missing} adjusted-close values missing` : 'Adjusted series used when complete'} />
              <Metric label="Data retrieved" value={quality ? new Date(quality.retrieved_at).toLocaleString() : 'Unavailable'} />
              <Metric label="Training period" value={forecast?.training_period_start && forecast.training_period_end ? `${forecast.training_period_start} – ${forecast.training_period_end}` : 'Unavailable'} note={forecast?.features.join(', ')} />
            </div>
            <div className="mt-4 rounded-md border border-slate-700 bg-slate-900/50 p-3 text-xs text-slate-400">
              {analysis.score === null && 'Risk score unavailable because the historical distribution is too short. '}
              {quality?.freshness === 'stale' && 'The latest available market observation is more than seven days old. '}
              {quality?.validation_status === 'partial' && 'Some rows were removed during data validation. '}
              {forecast?.status !== 'validated' && 'Forecast output is withheld unless walk-forward MAE beats the zero-return baseline and directional accuracy exceeds 50% on at least 60 test observations. '}
              A historical forecast-versus-actual chart is unavailable because this service does not yet persist forecasts made before outcomes occurred.
            </div>
          </section>

          <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-white"><TrendingUp className="h-4 w-4" />Computed readout</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>• {analysis.score === null ? 'The relative risk rank is unavailable for this amount of history.' : `Risk score ${analysis.score.toFixed(0)} reflects this ticker's relative historical risk, not the probability of a loss.`}</li>
              <li>• {analysis.indicators.price_vs_sma50 === null ? 'The 50-session moving-average comparison is unavailable.' : `Latest adjusted close is ${analysis.indicators.price_vs_sma50 >= 0 ? 'above' : 'below'} its 50-session average by ${pct(Math.abs(analysis.indicators.price_vs_sma50))}.`}</li>
              <li>• {analysis.indicators.rsi_14 === null ? 'RSI is unavailable.' : analysis.indicators.rsi_14 >= 70 ? `RSI is elevated at ${fixed(analysis.indicators.rsi_14, 1)}.` : analysis.indicators.rsi_14 <= 30 ? `RSI is depressed at ${fixed(analysis.indicators.rsi_14, 1)}.` : `RSI is between 30 and 70 at ${fixed(analysis.indicators.rsi_14, 1)}.`}</li>
              <li>• {analysis.indicators.macd === null || analysis.indicators.macd_signal === null ? 'MACD comparison is unavailable.' : `MACD is ${analysis.indicators.macd >= analysis.indicators.macd_signal ? 'above' : 'below'} its signal line.`}</li>
              <li>• {metrics?.benchmark_correlation === null ? `Benchmark metrics are unavailable for ${analysis.benchmark.ticker || 'this market'}.` : `Correlation with ${analysis.benchmark.ticker || 'the selected benchmark'} is ${fixed(metrics?.benchmark_correlation)} with beta ${fixed(metrics?.beta)}.`}</li>
              <li>• {forecast?.status === 'validated' ? `The ${horizon}-session ridge forecast passed the recorded historical test; that does not guarantee future performance.` : `The ${horizon}-session point estimate is withheld because validation evidence is insufficient or failed.`}</li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
