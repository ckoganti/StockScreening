import axios from 'axios'

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY
const symbols = ['AAPL', 'MSFT', 'NVDA', 'AMD', 'TSLA', 'GOOGL', 'AMZN', 'SPY', 'QQQ', 'IWM']

async function fetchStockData(symbol) {
  try {
    const [quoteRes, rsiRes, overviewRes, timeSeriesRes] = await Promise.all([
      axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`),
      axios.get(`https://www.alphavantage.co/query?function=RSI&symbol=${symbol}&interval=daily&time_period=14&series_type=close&apikey=${API_KEY}`),
      axios.get(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`),
      axios.get(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`)
    ])

    const quote = quoteRes.data['Global Quote']
    if (!quote) return null

    const rsiData = rsiRes.data['Technical Analysis: RSI']
    const overview = overviewRes.data
    const timeSeries = timeSeriesRes.data['Time Series (Daily)']

    const latestDate = Object.keys(rsiData || {})[0]
    const rsi = latestDate ? parseFloat(rsiData[latestDate].RSI) : 50

    const price = parseFloat(quote['05. price'])
    const volume = parseInt(quote['06. volume'])

    const relVolume = 1 // Placeholder

    let signal = 'HOLD'
    if (rsi < 30) signal = 'BUY'
    else if (rsi > 70) signal = 'SELL'

    const rrRatio = 2.0 // Placeholder

    const chartData = timeSeries ? Object.keys(timeSeries).slice(0, 30).reverse().map(date => ({
      date: date.slice(5), // MM-DD
      price: parseFloat(timeSeries[date]['4. close'])
    })) : null

    return {
      symbol,
      price,
      volume,
      rsi,
      relVolume,
      signal,
      rrRatio,
      sector: overview.Sector || 'Unknown',
      chartData,
      ipoDate: overview.IPODate
    }
  } catch (err) {
    console.error(`Error fetching data for ${symbol}:`, err)
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  if (!API_KEY || API_KEY === 'your_api_key_here') {
    return res.status(500).json({ error: 'API key not configured' })
  }

  try {
    const data = []
    for (const symbol of symbols) {
      const stock = await fetchStockData(symbol)
      if (stock) data.push(stock)
    }
    res.status(200).json(data)
  } catch (error) {
    console.error('API error:', error)
    res.status(500).json({ error: 'Failed to fetch stock data' })
  }
}