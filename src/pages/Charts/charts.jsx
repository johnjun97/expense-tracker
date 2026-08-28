import { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar/Navbar'
import Loading from '../../components/Loading/Loading'
import './charts.css'

function Charts() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadExpenses() {
      const { data, error } = await supabase
        .from('expenses_tracker_expenses')
        .select('*')
        .order('expense_date', { ascending: true })

      if (error) {
        console.error('Failed to load expenses:', error)
        setError(error.message)
        setLoading(false)
        return
      }

      setExpenses(data)
      setLoading(false)
    }

    loadExpenses()
  }, [])

  const totalSpending = expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  )

  const categorySpending = Object.values(
    expenses.reduce((result, expense) => {
      const category = expense.category?.trim()

      if (!category) {
        return result
      }

      if (!result[category]) {
        result[category] = {
          category,
          amount: 0,
        }
      }

      result[category].amount += Number(expense.amount)

      return result
    }, {})
  ).sort((a, b) => b.amount - a.amount)

  if (loading) {
    return (
      <>
        <Navbar />
        <Loading />
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />

        <div className="charts-page">
          <p>Error: {error}</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />

      <div className="charts-page">
        <div className="charts-header">
          <h1>Charts</h1>
        </div>

        <div className="charts-summary">
          <h2>Total Spending</h2>
          <strong>
            RM {totalSpending.toFixed(2)}
          </strong>
        </div>

        <div className="chart-card">
          <h2>Spending by Category</h2>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
<Pie
  data={categorySpending}
  dataKey="amount"
  nameKey="category"
  cx="50%"
  cy="45%"
  outerRadius={120}
  label={({ value }) => {
    const percentage = (Number(value) / totalSpending) * 100

    return `RM ${Number(value).toFixed(2)} (${percentage.toFixed(1)}%)`
  }}
>
                  {categorySpending.map((entry, index) => (
                    <Cell
                      key={entry.category}
                      fill={[
                        '#0088FE',
                        '#00C49F',
                        '#FFBB28',
                        '#FF8042',
                        '#8884D8',
                        '#82CA9D',
                        '#FF6666',
                        '#A4DE6C',
                      ][index % 8]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value, name) => [
                    `RM ${Number(value).toFixed(2)}`,
                    name,
                  ]}
                />

                <Legend />
              </PieChart>
              
            </ResponsiveContainer>
            <div className="mobile-category-list">
  {categorySpending.map((entry, index) => {
    const percentage =
      (Number(entry.amount) / totalSpending) * 100

    return (
      <div
        className="mobile-category-item"
        key={entry.category}
      >
        <span
          className="mobile-category-indicator"
          style={{
            background: [
              '#0088FE',
              '#00C49F',
              '#FFBB28',
              '#FF8042',
              '#8884D8',
              '#82CA9D',
              '#FF6666',
              '#A4DE6C',
            ][index % 8],
          }}
        />

        <span className="mobile-category-name">
          {entry.category}
        </span>

        <span className="mobile-category-amount">
          RM {Number(entry.amount).toFixed(2)}
        </span>

        <span className="mobile-category-percentage">
          {percentage.toFixed(1)}%
        </span>
      </div>
    )
  })}
</div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Charts