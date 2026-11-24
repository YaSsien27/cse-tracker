import { useEffect, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getPrices } from '../api.js'
import { formatDateTime, formatMoney } from '../format.js'
import { prefersReducedMotion } from '../motion.js'
import { showToast } from '../toast.js'

const ONE_DAY = 24 * 60 * 60 * 1000 // in milliseconds
const tickStyle = { fill: 'var(--muted)', fontSize: 12 }

// The price history chart for one symbol.
// lastFetched changes when a new price arrives, which reloads the chart.
function PriceChart({ symbol, lastFetched }) {
  const [points, setPoints] = useState(null) // null means "still loading"
  const [hasFailed, setHasFailed] = useState(false)

  useEffect(() => {
    let ignore = false // becomes true if this chart closes before the reply arrives

    async function load() {
      try {
        const prices = await getPrices(symbol)
        if (ignore) return
        // Recharts needs the time as a number
        setPoints(prices.map((row) => ({ time: new Date(row.fetched_at).getTime(), price: row.price })))
        setHasFailed(false)
      } catch (error) {
        if (ignore) return
        setHasFailed(true)
        showToast('error', error.message)
      }
    }

    load()
    return () => {
      ignore = true
    }
  }, [symbol, lastFetched])

  if (hasFailed) return <p className="note">No chart to show right now.</p>
  if (points === null) return <p className="note">Loading...</p>
  if (points.length === 0) return <p className="note">No prices saved for {symbol} yet.</p>

  // Show times for a single day of data, or dates for longer
  const isShort = points[points.length - 1].time - points[0].time < ONE_DAY
  const labelStyle = isShort ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short' }
  const formatTick = (time) => new Date(time).toLocaleString('en-GB', { timeZone: 'Asia/Colombo', ...labelStyle })

  return (
    <>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={points} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatTick}
            tick={tickStyle}
            stroke="var(--border)"
            minTickGap={40}
          />
          <YAxis
            domain={['auto', 'auto']}
            tickFormatter={(price) => price.toFixed(2)}
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
            width={65}
          />
          <Tooltip
            cursor={{ stroke: 'var(--muted)', strokeDasharray: '4 4' }}
            labelFormatter={formatDateTime}
            formatter={(price) => [formatMoney(price), 'Price']}
            contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 9 }}
            itemStyle={{ color: 'var(--text)' }}
          />
          {/* With only one price there is no line to draw, so show a dot */}
          <Line
            dataKey="price"
            type="linear"
            stroke="var(--line)"
            strokeWidth={2}
            dot={points.length === 1 ? { r: 4, fill: 'var(--line)' } : false}
            activeDot={{ r: 5 }}
            isAnimationActive={!prefersReducedMotion()} // draws the line from left to right
            animationDuration={900}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* The same data as text, newest first */}
      <details>
        <summary>Show latest prices as a table</summary>
        <table>
          <thead>
            <tr><th>Time (Sri Lanka)</th><th className="number">Price</th></tr>
          </thead>
          <tbody>
            {points.slice(-20).reverse().map((point) => (
              <tr key={point.time}>
                <td>{formatDateTime(point.time)}</td>
                <td className="number">{formatMoney(point.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  )
}

export default PriceChart
