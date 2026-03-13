import styles from './FilterPanel.module.css'

export default function FilterPanel({ filters, setFilters, sectors = [], onRun, scanning }) {
  const updateFilter = (key, value) => {
    setFilters({ ...filters, [key]: value })
  }

  return (
    <div className="filter-panel">
      <h2>Screening criteria</h2>

      <div className="filter-grid">
        <div className="filter-card">
          <label className="card-label">Min daily volume (M shares)</label>
          <input
            type="range"
            min="0"
            max="100000000"
            step="100000"
            value={filters.volume[0]}
            onChange={(e) => updateFilter('volume', [parseInt(e.target.value), filters.volume[1]])}
          />
          <div className="card-foot">{Math.round(filters.volume[0] / 1000000)}M</div>
        </div>

        <div className="filter-card">
          <label className="card-label">Price range ($)</label>
          <div className="two-inputs">
            <input
              type="number"
              value={filters.priceRange[0]}
              onChange={(e) => updateFilter('priceRange', [Number(e.target.value), filters.priceRange[1]])}
            />
            <span className="sep">–</span>
            <input
              type="number"
              value={filters.priceRange[1]}
              onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], Number(e.target.value)])}
            />
          </div>
        </div>

        <div className="filter-card">
          <label className="card-label">RSI range (oversold ↔ overbought)</label>
          <input
            type="range"
            min="0"
            max="100"
            value={filters.rsi[0]}
            onChange={(e) => updateFilter('rsi', [parseInt(e.target.value), filters.rsi[1]])}
          />
          <input
            type="range"
            min="0"
            max="100"
            value={filters.rsi[1]}
            onChange={(e) => updateFilter('rsi', [filters.rsi[0], parseInt(e.target.value)])}
          />
          <div className="card-foot">Scan within ±15 of this value</div>
        </div>

        <div className="filter-card">
          <label className="card-label">Min relative volume (vs 30-day avg)</label>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={filters.relVolume[0]}
            onChange={(e) => updateFilter('relVolume', [parseFloat(e.target.value), filters.relVolume[1]])}
          />
          <div className="card-foot">{filters.relVolume[0].toFixed(1)}x</div>
        </div>

        <div className="filter-card">
          <label className="card-label">Signal type</label>
          <select value={filters.signal} onChange={(e) => updateFilter('signal', e.target.value)}>
            <option value="ALL">All signals</option>
            <option value="BUY">Buy</option>
            <option value="HOLD">Hold</option>
            <option value="SELL">Sell</option>
          </select>
        </div>

        <div className="filter-card">
          <label className="card-label">Min R:R ratio</label>
          <select
            value={filters.rrRatio[0]}
            onChange={(e) => updateFilter('rrRatio', [parseFloat(e.target.value), filters.rrRatio[1]])}
          >
            <option value={0}>All</option>
            <option value={1}>1:1</option>
            <option value={1.5}>1.5:1</option>
            <option value={2}>2:1</option>
            <option value={3}>3:1</option>
          </select>
        </div>

        <div className="filter-card">
          <label className="card-label">Sector</label>
          <select value={filters.sector} onChange={(e) => updateFilter('sector', e.target.value)}>
            <option value="ALL">All Sectors</option>
            {sectors.map(sector => <option key={sector} value={sector}>{sector}</option>)}
          </select>
        </div>

        <div className="filter-card">
          <label className="card-label">IPO Date Range</label>
          <div className="two-inputs">
            <input
              type="date"
              value={filters.dateRange[0]}
              onChange={(e) => updateFilter('dateRange', [e.target.value, filters.dateRange[1]])}
            />
            <span className="sep">–</span>
            <input
              type="date"
              value={filters.dateRange[1]}
              onChange={(e) => updateFilter('dateRange', [filters.dateRange[0], e.target.value])}
            />
          </div>
        </div>
        <button className={styles.scanBtn} onClick={onRun} disabled={scanning}>
          {scanning ? '// scanning market...' : '▶ run screening scan'}
        </button>
      </div>

      <style jsx>{`
        .filter-panel { padding: 20px; border-radius: 18px; background: #f6f6f2; box-shadow: 0 6px 20px rgba(0,0,0,0.08); overflow: hidden; }
        h2 { margin-top: 0; font-size: 18px; }
        .filter-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(260px,1fr)); gap: 18px; }
        .filter-card { padding: 16px; border-radius: 16px; background: #fff; border: 1px solid rgba(0,0,0,0.05); }
        .card-label { display: block; font-weight: 600; margin-bottom: 10px; font-size: 13px; color: #444; }
        .two-inputs { display: flex; gap: 10px; align-items: center; }
        .two-inputs input { flex: 1; padding: 8px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.15); }
        .sep { font-size: 18px; color: #666; }
        .card-foot { margin-top: 10px; font-size: 12px; color: #666; }
        input[type=range] { width: 100%; }
        select { width: 100%; padding: 8px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.15); }
      `}</style>
    </div>
  )
}