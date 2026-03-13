import { useState, useEffect } from 'react'
import axios from 'axios'
import FilterPanel from '../components/FilterPanel'
import StockTable from '../components/StockTable'

export default function Home() {
  const [stocks, setStocks] = useState([])
  const [allStocks, setAllStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [filters, setFilters] = useState({
    volume: [0, 100000000],
    priceRange: [0, 1000],
    rsi: [0, 100],
    relVolume: [0, 5],
    signal: 'ALL',
    rrRatio: [0, 10],
    sector: 'ALL',
    dateRange: ['', '']
  })

  useEffect(() => {
    const fetchAllStocks = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await axios.get('/api/stocks')
        setAllStocks(response.data)
        setStocks(response.data)
        setLastUpdated(new Date())
      } catch (err) {
        console.error('Error fetching stocks:', err)
        setError('Failed to load stock data. Please check your API key configuration.')
      } finally {
        setLoading(false)
      }
    }

    fetchAllStocks()
  }, [])

  const applyFilters = () => {
    const filtered = allStocks.filter(stock => {
      const ipoDate = new Date(stock.ipoDate)
      const startDate = filters.dateRange[0] ? new Date(filters.dateRange[0]) : null
      const endDate = filters.dateRange[1] ? new Date(filters.dateRange[1]) : null

      return (
        stock.volume >= filters.volume[0] && stock.volume <= filters.volume[1] &&
        stock.price >= filters.priceRange[0] && stock.price <= filters.priceRange[1] &&
        stock.rsi >= filters.rsi[0] && stock.rsi <= filters.rsi[1] &&
        stock.relVolume >= filters.relVolume[0] && stock.relVolume <= filters.relVolume[1] &&
        (filters.signal === 'ALL' || stock.signal === filters.signal) &&
        stock.rrRatio >= filters.rrRatio[0] && stock.rrRatio <= filters.rrRatio[1] &&
        (filters.sector === 'ALL' || stock.sector === filters.sector) &&
        (!startDate || ipoDate >= startDate) &&
        (!endDate || ipoDate <= endDate)
      )
    })
    setStocks(filtered)
  }

  const runScan = async () => {
    setScanning(true)
    applyFilters()
    // Simulate a small scan delay for UI feedback
    await new Promise((resolve) => setTimeout(resolve, 500))
    setScanning(false)
  }

  useEffect(() => {
    if (allStocks.length > 0) {
      applyFilters()
    }
  }, [filters, allStocks])

  if (error) return <div>Error: {error}</div>

  return (
    <div className="container">
      <header className="page-header">
        <div>
          <h1>Stock Screening</h1>
          <p className="subtitle">Intraday filter workspace with sortable market signals</p>
        </div>
        <div className="meta-card">
          <span>Data source: Alpha Vantage</span>
          <span>
            Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'loading...'}
          </span>
        </div>
      </header>
      <div className="layout">
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          sectors={[...new Set(allStocks.map(s => s.sector))]}
          onRun={runScan}
          scanning={scanning}
        />
        <StockTable stocks={stocks} loading={loading || scanning} />
      </div>
    </div>
  )
}