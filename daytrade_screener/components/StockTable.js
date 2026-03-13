import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

const SORTABLE_COLUMNS = {
  symbol: (stock) => stock.symbol,
  price: (stock) => stock.price,
  volume: (stock) => stock.volume,
  rsi: (stock) => stock.rsi,
  relVolume: (stock) => stock.relVolume,
  signal: (stock) => stock.signal,
  rrRatio: (stock) => stock.rrRatio,
  sector: (stock) => stock.sector
}

export default function StockTable({ stocks, loading }) {
  const [sortBy, setSortBy] = useState('symbol')
  const [sortDir, setSortDir] = useState('asc')

  const sortedStocks = useMemo(() => {
    const selector = SORTABLE_COLUMNS[sortBy]
    if (!selector) return stocks

    return [...stocks].sort((a, b) => {
      const valueA = selector(a)
      const valueB = selector(b)

      if (typeof valueA === 'string') {
        const comparison = valueA.localeCompare(valueB)
        return sortDir === 'asc' ? comparison : -comparison
      }

      const comparison = valueA - valueB
      return sortDir === 'asc' ? comparison : -comparison
    })
  }, [stocks, sortBy, sortDir])

  const onSort = (column) => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortBy(column)
    setSortDir('asc')
  }

  const sortIndicator = (column) => {
    if (sortBy !== column) return '↕'
    return sortDir === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="stock-table">
      <div className="table-header">
        <h2>Stock List</h2>
        {!loading && <span className="table-count">{sortedStocks.length} matches</span>}
      </div>

      {loading && (
        <div className="table-skeleton" aria-live="polite">
          <div className="skeleton-row" />
          <div className="skeleton-row" />
          <div className="skeleton-row" />
          <div className="skeleton-row" />
        </div>
      )}

      {!loading && sortedStocks.length === 0 && (
        <div className="table-empty" role="status">
          <h3>No stocks match these filters</h3>
          <p>Try widening RSI, volume, or price range to see more opportunities.</p>
        </div>
      )}

      {!loading && sortedStocks.length > 0 && <table>
        <thead>
          <tr>
            <th><button type="button" className="sort-btn" onClick={() => onSort('symbol')}>Symbol {sortIndicator('symbol')}</button></th>
            <th><button type="button" className="sort-btn" onClick={() => onSort('price')}>Price {sortIndicator('price')}</button></th>
            <th><button type="button" className="sort-btn" onClick={() => onSort('volume')}>Volume {sortIndicator('volume')}</button></th>
            <th><button type="button" className="sort-btn" onClick={() => onSort('rsi')}>RSI {sortIndicator('rsi')}</button></th>
            <th><button type="button" className="sort-btn" onClick={() => onSort('relVolume')}>Rel Volume {sortIndicator('relVolume')}</button></th>
            <th><button type="button" className="sort-btn" onClick={() => onSort('signal')}>Signal {sortIndicator('signal')}</button></th>
            <th><button type="button" className="sort-btn" onClick={() => onSort('rrRatio')}>R:R Ratio {sortIndicator('rrRatio')}</button></th>
            <th><button type="button" className="sort-btn" onClick={() => onSort('sector')}>Sector {sortIndicator('sector')}</button></th>
            <th>Chart (30 days)</th>
          </tr>
        </thead>
        <tbody>
          {sortedStocks.map(stock => (
            <tr key={stock.symbol}>
              <td><strong>{stock.symbol}</strong></td>
              <td>${stock.price.toFixed(2)}</td>
              <td>{stock.volume.toLocaleString('en-US')}</td>
              <td>{stock.rsi.toFixed(2)}</td>
              <td>{stock.relVolume.toFixed(1)}x</td>
              <td>
                <span className={`signal-badge signal-${stock.signal.toLowerCase()}`}>{stock.signal}</span>
              </td>
              <td>{stock.rrRatio.toFixed(1)}</td>
              <td>{stock.sector}</td>
              <td>
                {stock.chartData ? (
                  <LineChart width={200} height={100} data={stock.chartData}>
                    <Line type="monotone" dataKey="price" stroke="#0ea5a4" strokeWidth={2} dot={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                  </LineChart>
                ) : <span className="chart-placeholder">Not loaded</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>}
    </div>
  )
}