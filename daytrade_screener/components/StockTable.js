import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export default function StockTable({ stocks }) {
  return (
    <div className="stock-table">
      <h2>Stock List</h2>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Price</th>
            <th>Volume</th>
            <th>RSI</th>
            <th>Rel Volume</th>
            <th>Signal</th>
            <th>R:R Ratio</th>
            <th>Sector</th>
            <th>Chart (30 days)</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map(stock => (
            <tr key={stock.symbol}>
              <td>{stock.symbol}</td>
              <td>${stock.price.toFixed(2)}</td>
              <td>{stock.volume.toLocaleString()}</td>
              <td>{stock.rsi.toFixed(2)}</td>
              <td>{stock.relVolume.toFixed(1)}x</td>
              <td>{stock.signal}</td>
              <td>{stock.rrRatio.toFixed(1)}</td>
              <td>{stock.sector}</td>
              <td>
                {stock.chartData ? (
                  <LineChart width={200} height={100} data={stock.chartData}>
                    <Line type="monotone" dataKey="price" stroke="#8884d8" strokeWidth={2} dot={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                  </LineChart>
                ) : 'No data'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}