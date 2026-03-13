import axios from 'axios'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_MODEL = 'meta-llama/llama-3.1-8b-instruct'

function formatStocks(stocks) {
  return stocks.slice(0, 12).map((stock) => ({
    symbol: stock.symbol,
    price: Number(stock.price).toFixed(2),
    rsi: Number(stock.rsi).toFixed(1),
    signal: stock.signal,
    relVolume: Number(stock.relVolume).toFixed(1),
    rrRatio: Number(stock.rrRatio).toFixed(1),
    sector: stock.sector
  }))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      error: 'OPENROUTER_API_KEY is not configured'
    })
  }

  const { stocks = [], filters = {} } = req.body || {}
  if (!Array.isArray(stocks) || stocks.length === 0) {
    return res.status(400).json({ error: 'No stocks provided for analysis' })
  }

  const model = process.env.LLM_MODEL || DEFAULT_MODEL
  const stockSummary = formatStocks(stocks)

  const systemPrompt = [
    'You are a concise financial market assistant for a stock screener dashboard.',
    'Provide educational insights only, not financial advice.',
    'Keep the response short, clear, and action-oriented.',
    'Use exactly 3 bullets titled: Momentum, Risk, Watchlist.'
  ].join(' ')

  const userPrompt = JSON.stringify({
    filters,
    sample_size: stockSummary.length,
    stocks: stockSummary
  })

  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model,
        temperature: 0.2,
        max_tokens: 280,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
          'X-Title': 'daytrade-screener'
        },
        timeout: 20000
      }
    )

    const summary = response.data?.choices?.[0]?.message?.content?.trim()
    if (!summary) {
      return res.status(502).json({ error: 'Model returned empty response' })
    }

    return res.status(200).json({
      model,
      summary
    })
  } catch (error) {
    const status = error?.response?.status || 500
    const details = error?.response?.data?.error?.message || error.message
    return res.status(status).json({ error: `AI request failed: ${details}` })
  }
}
