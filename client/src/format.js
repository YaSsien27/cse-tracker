// Turns raw values into text that is easy to read.
// A dash is shown when there is no value yet.

const twoDecimals = { minimumFractionDigits: 2, maximumFractionDigits: 2 }

// 1234.5 -> "Rs. 1,234.50"
export function formatMoney(value) {
  if (value === null) return '–'
  const sign = value < 0 ? '-' : ''
  return `${sign}Rs. ${Math.abs(value).toLocaleString('en-US', twoDecimals)}`
}

// Same, but with a + in front of profits
export function formatProfit(value) {
  return value > 0 ? `+${formatMoney(value)}` : formatMoney(value)
}

// 12.5 -> "+12.50%"
export function formatPercent(value) {
  if (value === null) return '–'
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}

// Picks the CSS class that makes a number green or red
export function profitClass(value) {
  if (value > 0) return 'profit'
  if (value < 0) return 'loss'
  return ''
}

// Always shows Sri Lanka time
export function formatDateTime(value) {
  return new Date(value).toLocaleString('en-GB', {
    timeZone: 'Asia/Colombo',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Today in Sri Lanka as YYYY-MM-DD ("en-CA" happens to use that style)
export function todayInColombo() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' })
}
