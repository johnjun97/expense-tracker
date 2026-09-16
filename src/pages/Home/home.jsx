import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Card from '../../components/Card/Card'
import Navbar from '../../components/Navbar/Navbar'
import Loading from '../../components/Loading/Loading'
import './home.css'

function Home() {
  const [todayExpenses, setTodayExpenses] = useState([])
  const [currencyFilter, setCurrencyFilter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedCategories, setExpandedCategories] = useState({})

  const navigate = useNavigate()

  function toggleCategory(category) {
    setExpandedCategories((current) => ({
      ...current,
      [category]: !current[category],
    }))
  }

  useEffect(() => {
    async function loadTodayExpenses() {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('expenses_tracker_expenses')
        .select('*')
        .eq('expense_date', today)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load today expenses:', error)
        setError(error.message)
        setLoading(false)
        return
      }

      setTodayExpenses(data)

      const currencies = [
        ...new Set(
          data
            .map((expense) => expense.currency || 'MYR')
            .filter(Boolean)
        ),
      ]

      if (data.length > 0) {
        setCurrencyFilter(data[0].currency || 'MYR')
      }

      setLoading(false)
    }

    loadTodayExpenses()
  }, [])

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

        <div className="home-page">
          <p>Error: {error}</p>
        </div>
      </>
    )
  }

  const currencies = [
    ...new Set(
      todayExpenses
        .map((expense) => expense.currency || 'MYR')
        .filter(Boolean)
    ),
  ]

  const filteredExpenses = todayExpenses.filter((expense) => {
    const currency = expense.currency || 'MYR'

    return !currencyFilter || currency === currencyFilter
  })

  const totalsByCurrency = {}

  for (const expense of filteredExpenses) {
    const currency = expense.currency || 'MYR'

    if (!totalsByCurrency[currency]) {
      totalsByCurrency[currency] = 0
    }

    totalsByCurrency[currency] += Number(expense.amount)
  }

  return (
    <>
      <Navbar />

      <main className="home-page">
        <div className="home-content">
          <h1>Home</h1>

          <Card
            title={
              <span
                className="today-expenses-title"
                onClick={() => navigate('/expenses?date=today')}
              >
                Today's Expenses
              </span>
            }
            actions={
              <div className="today-expenses-filter">
                <label htmlFor="currency-filter">
                  Currency
                </label>

                <select
                  id="currency-filter"
                  value={currencyFilter || ''}
                  onChange={(event) =>
                    setCurrencyFilter(event.target.value)
                  }
                >
                  {currencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
            }
          >
            <div className="today-expenses-total">
              {Object.entries(totalsByCurrency).map(
                ([currency, total]) => (
                  <strong key={currency}>
                    {currency} {total.toFixed(2)}
                  </strong>
                )
              )}
            </div>

            <div className="today-expenses-list">
              {filteredExpenses.length === 0 ? (
                <p>No expenses today.</p>
              ) : (
                Object.entries(
                  filteredExpenses.reduce((groups, expense) => {
                    const category =
                      expense.category || 'Uncategorized'

                    if (!groups[category]) {
                      groups[category] = []
                    }

                    groups[category].push(expense)

                    return groups
                  }, {})
                ).map(([category, categoryExpenses]) => {
                  const categoryTotal = categoryExpenses.reduce(
                    (total, expense) =>
                      total + Number(expense.amount),
                    0
                  )

                  const currency =
                    categoryExpenses[0]?.currency || 'MYR'

                  return (
                    <div
                      className="today-expense-category"
                      key={category}
                    >
               <div
  className="today-expense-category-header"
  onClick={() => {
    const hasSubcategory = categoryExpenses.some(
      (expense) => expense.subcategory?.trim()
    )

    if (hasSubcategory) {
      toggleCategory(category)
    } else {
      navigate(
        `/expenses?date=today&search=${encodeURIComponent(category)}`
      )
    }
  }}
>
  <strong className="today-expense-category-name">
    {category}
  </strong>

  <div className="today-expense-category-total">
    <strong>
      {currency} {categoryTotal.toFixed(2)}
    </strong>

    {categoryExpenses.some(
      (expense) => expense.subcategory?.trim()
    ) && (
      <span className="today-expense-expand-icon">
        {expandedCategories[category] ? '▾' : '▸'}
      </span>
    )}
  </div>
</div>

                      {expandedCategories[category] && (
                        <div className="today-expense-category-items">
                          {Object.entries(
                            categoryExpenses.reduce(
                              (groups, expense) => {
                                const subcategory =
                                  expense.subcategory ||
                                  'Uncategorized'

                                if (!groups[subcategory]) {
                                  groups[subcategory] = []
                                }

                                groups[subcategory].push(expense)

                                return groups
                              },
                              {}
                            )
                          ).map(
                            ([
                              subcategory,
                              subcategoryExpenses,
                            ]) => {
                              const subcategoryTotal =
                                subcategoryExpenses.reduce(
                                  (total, expense) =>
                                    total +
                                    Number(expense.amount),
                                  0
                                )

                              return (
                                <div
                                  className="today-expense-subcategory-group"
                                  key={subcategory}
                                >
                                  <div
                                    className="today-expense-subcategory-header"
                                    onClick={() =>
                                      navigate(
                                        `/expenses?date=today&search=${encodeURIComponent(subcategory)}`
                                      )
                                    }
                                  >
                                    <strong>{subcategory}</strong>

                                    <strong>
                                      {currency} {subcategoryTotal.toFixed(2)}
                                    </strong>
                                  </div>

                                  {(() => {
                                    const actualSubSubcategories = subcategoryExpenses.filter(
                                      (expense) =>
                                        expense.sub_subcategory &&
                                        expense.sub_subcategory.trim().toLowerCase() !== 'no description'
                                    )

                                    const otherExpenses = subcategoryExpenses.filter(
                                      (expense) =>
                                        !expense.sub_subcategory ||
                                        expense.sub_subcategory.trim().toLowerCase() === 'no description'
                                    )

                                    const otherTotal = otherExpenses.reduce(
                                      (total, expense) => total + Number(expense.amount),
                                      0
                                    )

                                    if (actualSubSubcategories.length === 0) {
                                      return null
                                    }

                                    return (
                                      <div className="today-expense-sub-subcategory-list">
                                        {actualSubSubcategories.map((expense) => (
                                          <div
                                            className="today-expense-sub-subcategory-item"
                                            key={expense.id}
                                            onClick={() =>
                                              navigate(
                                                `/expenses?date=today&search=${encodeURIComponent(
                                                  expense.sub_subcategory
                                                )}`
                                              )
                                            }
                                          >
                                            <span>
                                              {expense.sub_subcategory}
                                            </span>

                                            <strong>
                                              {expense.currency || 'MYR'}{' '}
                                              {Number(expense.amount).toFixed(2)}
                                            </strong>
                                          </div>
                                        ))}

                                        {otherExpenses.length > 0 && (
                                          <div
                                            className="today-expense-sub-subcategory-item"
                                            onClick={() =>
                                              navigate(
                                                `/expenses?date=today&search=${encodeURIComponent(subcategory)}`
                                              )
                                            }
                                          >
                                            <span>Others</span>

                                            <strong>
                                              {currency} {otherTotal.toFixed(2)}
                                            </strong>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })()}
                                </div>
                              )
                            }
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        </div>
      </main>
    </>
  )
}

export default Home