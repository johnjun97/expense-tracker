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
import { useNavigate } from 'react-router-dom'
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

const renderPieLabel = ({
  value,
  name,
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  chartTotal,
  selectedCurrency,
  isMobile,
}) => {
  const percentage =
    chartTotal > 0
      ? (Number(value) / chartTotal) * 100
      : 0

  const RADIAN = Math.PI / 180

  // Mobile: only show labels for slices >= %
  if (isMobile) {
    if (percentage <= 25) {
      return null
    }

    const radius =
      innerRadius + (outerRadius - innerRadius) * 0.5

    const x =
      cx + radius * Math.cos(-midAngle * RADIAN)

    const y =
      cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fill="#fff"
      >
        <tspan x={x} dy="-6">
          {name}
        </tspan>

        <tspan x={x} dy="13">
          {selectedCurrency} {Number(value).toFixed(2)} ({percentage.toFixed(1)}%)
        </tspan>
      </text>
    )
  }

  // Desktop
  // Keep labels invisible for slices <= 1%
  const isInvisible = percentage <= 1

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
      visibility={isInvisible ? 'hidden' : 'visible'}
    >
      {`${name} — ${selectedCurrency} ${Number(value).toFixed(2)} (${percentage.toFixed(1)}%)`}
    </text>
  )
}

const renderPieLabelLine = (props) => {
  const {
    points,
    value,
    chartTotal,
  } = props

  const percentage =
    chartTotal > 0
      ? (Number(value) / chartTotal) * 100
      : 0

  if (percentage <= 1 || !points || points.length < 2) {
    return null
  }

  return (
    <path
      d={`M${points[0].x},${points[0].y}L${points[1].x},${points[1].y}`}
      stroke="#999"
      fill="none"
    />
  )
}

function Charts() {

  const [expenses, setExpenses] = useState([])
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const currentDate = new Date()
  const currentYear = String(currentDate.getFullYear())
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0')

  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedCurrency, setSelectedCurrency] = useState('MYR')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600)

  function goToExpenses(search, level = '') {
    const params = new URLSearchParams()

    params.set('search', search)

    if (level) {
      params.set('level', level)
    }

    navigate(`/expenses?${params.toString()}`)
  }

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

  const currencySuggestions = [
    ...new Set(
      expenses
        .map((expense) => expense.currency?.trim().toUpperCase())
        .filter(Boolean)
    ),
  ]

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

    if (
      selectedCurrency &&
      expense.currency?.trim().toUpperCase() !== selectedCurrency
    ) {
      return false
    }

    return true
  })

  const totalSpending = filteredExpenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  )

  const currentSpending = filteredExpenses.reduce((total, expense) => {
    if (selectedCategory) {
      const matchesCategory =
        selectedCategory === 'Uncategorized'
          ? !expense.category?.trim()
          : expense.category?.trim() === selectedCategory

      if (!matchesCategory) {
        return total
      }
    }
    if (selectedSubcategory) {
      const matchesSubcategory =
        selectedSubcategory === 'Uncategorized'
          ? !expense.subcategory?.trim()
          : expense.subcategory?.trim() === selectedSubcategory

      if (!matchesSubcategory) {
        return total
      }
    }

    return total + Number(expense.amount)
  }, 0)

  const categorySpending = Object.values(
    filteredExpenses.reduce((result, expense) => {
      const category = expense.category?.trim() || 'Uncategorized'

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
        const matchesCategory =
          selectedCategory === 'Uncategorized'
            ? !expense.category?.trim()
            : expense.category?.trim() === selectedCategory

        if (!matchesCategory) {
          return result
        }

        const subcategory = expense.subcategory?.trim() || 'Uncategorized'

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
        const matchesCategory =
          selectedCategory === 'Uncategorized'
            ? !expense.category?.trim()
            : expense.category?.trim() === selectedCategory

        const matchesSubcategory =
          selectedSubcategory === 'Uncategorized'
            ? !expense.subcategory?.trim()
            : expense.subcategory?.trim() === selectedSubcategory

        if (!matchesCategory || !matchesSubcategory) {
          return result
        }

        const subsubcategory =
          expense.sub_subcategory?.trim() || 'Uncategorized'

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

  // ADD HERE
  const currentChartData =
    selectedSubcategory
      ? subsubcategorySpending
      : selectedCategory
        ? subcategorySpending
        : categorySpending

  const chartTotal = currentChartData.reduce(
    (total, entry) => total + Number(entry.amount),
    0
  )

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
          <div className="charts-summary-title">
            <h2>
              Total Spending
              {selectedCategory && ` — ${selectedCategory}`}
              {selectedSubcategory && ` — ${selectedSubcategory}`}
            </h2>

            <div className="currency-filter-group">
              <select
                id="currency-filter"
                value={selectedCurrency}
                onChange={(event) => {
                  setSelectedCurrency(event.target.value)
                  setSelectedCategory(null)
                  setSelectedSubcategory(null)
                }}
              >
                {currencySuggestions.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>

          </div>
          <strong>
            {selectedCurrency} {currentSpending.toFixed(2)}
          </strong>
        </div>

        <div className="chart-card">
          <div className="chart-title">
            <div className="chart-breadcrumb">
              <span
                className="breadcrumb-link"
                onClick={() => {
                  setSelectedCategory(null)
                  setSelectedSubcategory(null)
                }}
              >
                Category
              </span>

              {selectedCategory && (
                <>
                  <span className="breadcrumb-separator"> / </span>

                  <span
                    className="breadcrumb-link"
                    onClick={() => setSelectedSubcategory(null)}
                  >
                    {selectedCategory}
                  </span>
                </>
              )}

              {selectedSubcategory && (
                <>
                  <span className="breadcrumb-separator"> / </span>

                  <span className="breadcrumb-current">
                    {selectedSubcategory}
                  </span>
                </>
              )}
            </div>

            {(selectedCategory || selectedSubcategory) && (
              <button
                type="button"
                onClick={() => {
                  if (selectedSubcategory) {
                    setSelectedSubcategory(null)
                  } else {
                    setSelectedCategory(null)
                  }
                }}
              >
                Back
              </button>
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
                    outerRadius={isMobile ? 160 : 120}
                    activeShape={false}
labelLine={(props) =>
  renderPieLabelLine({
    ...props,
    chartTotal,
  })
}
                    label={(props) =>
                      renderPieLabel({
                        ...props,
                        chartTotal,
                        selectedCurrency,
                        isMobile,
                      })
                    }
                    onClick={(data) => {
                      if (!data?.category) {
                        return
                      }

                      // Category level
                      if (!selectedCategory) {
                        if (data.category === 'Uncategorized') {
                          goToExpenses(data.category, 'category')
                          return
                        }

                        setSelectedCategory(data.category)
                        return
                      }

                      // Subcategory level
                      if (!selectedSubcategory) {
                        const hasSubSubcategory = filteredExpenses.some(
                          (expense) => {
                            const matchesCategory =
                              selectedCategory === 'Uncategorized'
                                ? !expense.category?.trim()
                                : expense.category?.trim() === selectedCategory

                            const matchesSubcategory =
                              expense.subcategory?.trim() === data.category ||
                              (
                                data.category === 'Uncategorized' &&
                                !expense.subcategory?.trim()
                              )

                            return (
                              matchesCategory &&
                              matchesSubcategory &&
                              expense.sub_subcategory?.trim()
                            )
                          }
                        )

                        if (!hasSubSubcategory) {
                          goToExpenses(
                            data.category,
                            data.category === 'Uncategorized'
                              ? 'subcategory'
                              : ''
                          )
                          return
                        }

                        setSelectedSubcategory(data.category)
                        return
                      }

                      // Sub-subcategory level
                      goToExpenses(
                        data.category,
                        data.category === 'Uncategorized'
                          ? 'sub_subcategory'
                          : ''
                      )
                    }}
                    cursor={!isMobile && !selectedCategory ? 'pointer' : 'default'}
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

                  {!isMobile && (
                    <Tooltip
                      formatter={(value, name) => {
                        const percentage =
                          chartTotal > 0
                            ? (Number(value) / chartTotal) * 100
                            : 0

                        return [
                          `${selectedCurrency} ${Number(value).toFixed(2)} (${percentage.toFixed(1)}%)`,
                          name,
                        ]
                      }}
                    />
                  )}

                  <Legend
                    onClick={(data) => {
                      if (!data?.value) {
                        return
                      }

                      const value = data.value

                      // Category level
                      if (!selectedCategory) {
                        if (value === 'Uncategorized') {
                          goToExpenses(value, 'category')
                          return
                        }

                        setSelectedCategory(value)
                        return
                      }

                      // Subcategory level
                      if (!selectedSubcategory) {
                        const hasSubSubcategory = filteredExpenses.some(
                          (expense) => {
                            const matchesCategory =
                              selectedCategory === 'Uncategorized'
                                ? !expense.category?.trim()
                                : expense.category?.trim() === selectedCategory

                            const matchesSubcategory =
                              expense.subcategory?.trim() === value ||
                              (
                                value === 'Uncategorized' &&
                                !expense.subcategory?.trim()
                              )

                            return (
                              matchesCategory &&
                              matchesSubcategory &&
                              expense.sub_subcategory?.trim()
                            )
                          }
                        )

                        if (!hasSubSubcategory) {
                          goToExpenses(
                            value,
                            value === 'Uncategorized'
                              ? 'subcategory'
                              : ''
                          )
                          return
                        }

                        setSelectedSubcategory(value)
                        return
                      }

                      // Sub-subcategory level
                      goToExpenses(
                        value,
                        value === 'Uncategorized'
                          ? 'sub_subcategory'
                          : ''
                      )
                    }}
                    formatter={(value) => (
                      <span
                        style={{
                          cursor: 'pointer',
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
                    chartTotal > 0
                      ? (Number(entry.amount) / chartTotal) * 100
                      : 0

                  return (
                    <div
                      className="mobile-category-item"
                      key={entry.category}
                      onClick={() => {
                        if (!selectedCategory) {
                          if (entry.category === 'Uncategorized') {
                            goToExpenses(entry.category, 'category')
                            return
                          }

                          setSelectedCategory(entry.category)
                          return
                        }

                        if (!selectedSubcategory) {
                          const hasSubSubcategory = filteredExpenses.some(
                            (expense) => {
                              const matchesCategory =
                                selectedCategory === 'Uncategorized'
                                  ? !expense.category?.trim()
                                  : expense.category?.trim() === selectedCategory

                              const matchesSubcategory =
                                expense.subcategory?.trim() === entry.category ||
                                (
                                  entry.category === 'Uncategorized' &&
                                  !expense.subcategory?.trim()
                                )

                              return (
                                matchesCategory &&
                                matchesSubcategory &&
                                expense.sub_subcategory?.trim()
                              )
                            }
                          )

                          if (!hasSubSubcategory) {
                            goToExpenses(
                              entry.category,
                              entry.category === 'Uncategorized'
                                ? 'subcategory'
                                : ''
                            )
                            return
                          }

                          setSelectedSubcategory(entry.category)
                          return
                        }

                        goToExpenses(
                          entry.category,
                          entry.category === 'Uncategorized'
                            ? 'sub_subcategory'
                            : ''
                        )
                      }}
                      style={{
                        cursor: 'pointer',
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
                        {selectedCurrency} {Number(entry.amount).toFixed(2)}
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