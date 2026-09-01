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

const CATEGORY_COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
  '#FF6666',
  '#A4DE6C',
]

const getSubcategoryColors = (baseColor, count) => {
  const color = baseColor.replace('#', '')
  const r = parseInt(color.slice(0, 2), 16)
  const g = parseInt(color.slice(2, 4), 16)
  const b = parseInt(color.slice(4, 6), 16)

  const darkestFactor =
    count <= 2 ? 0.7 :
      count === 3 ? 0.6 :
        0.5

  const lightestFactor = 0.9

  return Array.from({ length: count }, (_, index) => {
    const factor =
      darkestFactor +
      (index / Math.max(count - 1, 1)) *
      (lightestFactor - darkestFactor)

    return `rgb(
      ${Math.round(r * factor)},
      ${Math.round(g * factor)},
      ${Math.round(b * factor)}
    )`
  })
}

function Charts() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const currentDate = new Date()
  const currentYear = String(currentDate.getFullYear())
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0')

  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

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

  const filteredExpenses = expenses.filter((expense) => {
    const date = expense.expense_date

    if (!date) {
      return false
    }

    const [year, month] = date.split('-')

    if (selectedYear && year !== selectedYear) {
      return false
    }

    if (selectedMonth && month !== selectedMonth) {
      return false
    }

    return true
  })

  const totalSpending = filteredExpenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  )


  const categorySpending = Object.values(
    filteredExpenses.reduce((result, expense) => {
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

  const subcategorySpending = selectedCategory
    ? Object.values(
      filteredExpenses.reduce((result, expense) => {
        if (expense.category?.trim() !== selectedCategory) {
          return result
        }

        const subcategory = expense.subcategory?.trim() || 'Others'

        if (!result[subcategory]) {
          result[subcategory] = {
            category: subcategory,
            amount: 0,
          }
        }

        result[subcategory].amount += Number(expense.amount)

        return result
      }, {})
    ).sort((a, b) => b.amount - a.amount)
    : []

  const subsubcategorySpending = selectedSubcategory
    ? Object.values(
      filteredExpenses.reduce((result, expense) => {
        if (
          expense.category?.trim() !== selectedCategory ||
          expense.subcategory?.trim() !== selectedSubcategory
        ) {
          return result
        }

        const subsubcategory =
          expense.sub_subcategory?.trim() || 'Others'

        if (!result[subsubcategory]) {
          result[subsubcategory] = {
            category: subsubcategory,
            amount: 0,
          }
        }

        result[subsubcategory].amount += Number(expense.amount)

        return result
      }, {})
    ).sort((a, b) => b.amount - a.amount)
    : []

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
        <div className="charts-filter">
          <label htmlFor="year-filter">Year</label>

          <select
            id="year-filter"
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
          >
            <option value="">All Years</option>

            {[...new Set(
              expenses
                .map((expense) => expense.expense_date?.slice(0, 4))
                .filter(Boolean)
            )]
              .sort()
              .reverse()
              .map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
          </select>

          <label htmlFor="month-filter">Month</label>

          <select
            id="month-filter"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
          >
            <option value="">All Months</option>

            {Array.from({ length: 12 }, (_, index) => {
              const month = String(index + 1).padStart(2, '0')
              const date = new Date(2000, index)

              return (
                <option key={month} value={month}>
                  {date.toLocaleDateString('en-GB', {
                    month: 'long',
                  })}
                </option>
              )
            })}
          </select>
        </div>

        <div className="charts-summary">
          <h2>Total Spending</h2>
          <strong>
            RM {totalSpending.toFixed(2)}
          </strong>
        </div>

        <div className="chart-card">
          <div className="chart-title">
            {selectedSubcategory ? (
              <>
                <h2>Sub_subcategory ({selectedCategory} &gt; {selectedSubcategory})</h2>
                <button
                  type="button"
                  onClick={() => setSelectedSubcategory(null)}
                >
                  Back
                </button>
              </>
            ) : selectedCategory ? (
              <>
                <h2>Subcategory ({selectedCategory})</h2>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(null)
                    setSelectedSubcategory(null)
                  }}
                >
                  Back
                </button>
              </>
            ) : (
              <h2>Category</h2>
            )}
          </div>

          <div className="chart-container">
            <div className="pie-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      selectedSubcategory
                        ? subsubcategorySpending
                        : selectedCategory
                          ? subcategorySpending
                          : categorySpending
                    }
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="45%"
                    outerRadius={120}
                    labelLine={
                      !isMobile
                        ? ({ index }) => {
                          const chartData = selectedSubcategory
                            ? subsubcategorySpending
                            : selectedCategory
                              ? subcategorySpending
                              : categorySpending

                          const value = Number(chartData[index]?.amount || 0)

                          const percentage =
                            totalSpending > 0
                              ? (value / totalSpending) * 100
                              : 0

                          return percentage >= 5
                        }
                        : false
                    }
                    label={
                      isMobile
                        ? false
                        : ({ value, cx, cy, midAngle, outerRadius }) => {
                          const percentage =
                            totalSpending > 0
                              ? (Number(value) / totalSpending) * 100
                              : 0

                          // Do not show labels for small slices
                          if (percentage < 5) {
                            return null
                          }

                          const RADIAN = Math.PI / 180
                          const radius = outerRadius + 35

                          const x =
                            cx + radius * Math.cos(-midAngle * RADIAN)

                          const y =
                            cy + radius * Math.sin(-midAngle * RADIAN)

                          return (
                            <text
                              x={x}
                              y={y}
                              textAnchor={x > cx ? 'start' : 'end'}
                              dominantBaseline="central"
                              fontSize={12}
                            >
                              {`RM ${Number(value).toFixed(2)} (${percentage.toFixed(1)}%)`}
                            </text>
                          )
                        }
                    }
                    onClick={(data) => {
                      if (!data?.category) {
                        return
                      }

                      if (!selectedCategory) {
                        setSelectedCategory(data.category)
                        return
                      }

                      if (!selectedSubcategory) {
                        setSelectedSubcategory(data.category)
                      }
                    }}
                    cursor={!selectedCategory ? 'pointer' : 'default'}
                  >
                    {(
                      selectedSubcategory
                        ? subsubcategorySpending
                        : selectedCategory
                          ? subcategorySpending
                          : categorySpending
                    ).map(
                      (entry, index) => {
                        const categoryIndex = categorySpending.findIndex(
                          (item) => item.category === selectedCategory
                        )

                        const baseColor = CATEGORY_COLORS[
                          categoryIndex >= 0 ? categoryIndex % CATEGORY_COLORS.length : index % CATEGORY_COLORS.length
                        ]

                        const colorData = selectedSubcategory
                          ? subsubcategorySpending
                          : selectedCategory
                            ? subcategorySpending
                            : categorySpending

                        const subcategoryColors = getSubcategoryColors(
                          baseColor,
                          colorData.length
                        )

                        return (
                          <Cell
                            key={entry.category}
                            fill={
                              selectedSubcategory
                                ? subcategoryColors[index]
                                : selectedCategory
                                  ? subcategoryColors[index]
                                  : CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                            }
                          />
                        )
                      }
                    )}
                  </Pie>

                  <Tooltip
                    formatter={(value, name) => [
                      `RM ${Number(value).toFixed(2)}`,
                      name,
                    ]}
                  />

                  <Legend
                    onClick={(data) => {
                      if (!selectedCategory && data?.value) {
                        setSelectedCategory(data.value)
                      }
                    }}
                    formatter={(value) => (
                      <span
                        style={{
                          cursor: selectedCategory ? 'default' : 'pointer',
                        }}
                      >
                        {value}
                      </span>
                    )}
                  />
                </PieChart>

              </ResponsiveContainer>
            </div>

            <div className="mobile-category-list">
              {(
                selectedSubcategory
                  ? subsubcategorySpending
                  : selectedCategory
                    ? subcategorySpending
                    : categorySpending
              ).map(
                (entry, index) => {
                  const percentage =
                    (Number(entry.amount) / totalSpending) * 100

                  return (
                    <div
                      className="mobile-category-item"
                      key={entry.category}
                      onClick={() => {
                        if (!selectedCategory) {
                          setSelectedCategory(entry.category)
                          return
                        }

                        if (!selectedSubcategory) {
                          setSelectedSubcategory(entry.category)
                        }
                      }}
                      style={{
                        cursor: selectedCategory ? 'default' : 'pointer',
                      }}
                    >
                      <span
                        className="mobile-category-indicator"
                        style={{
                          background: (() => {
                            const categoryIndex = categorySpending.findIndex(
                              (item) => item.category === selectedCategory
                            )

                            const baseColor =
                              CATEGORY_COLORS[
                              categoryIndex >= 0
                                ? categoryIndex % CATEGORY_COLORS.length
                                : index % CATEGORY_COLORS.length
                              ]

                            const subcategoryColors = getSubcategoryColors(
                              baseColor,
                              subcategorySpending.length
                            )

                            return selectedCategory
                              ? subcategoryColors[index]
                              : baseColor
                          })(),
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
      </div >
    </>
  )
}

export default Charts