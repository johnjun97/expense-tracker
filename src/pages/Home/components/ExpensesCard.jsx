import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../../components/Card/Card'

function ExpensesCard({
  expenses,
  currencyFilter,
  setCurrencyFilter,
  dateFilter,
  setDateFilter,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
}) {
  const [expandedCategories, setExpandedCategories] =
    useState({})

  const navigate = useNavigate()

  function toggleCategory(category) {
    setExpandedCategories((current) => ({
      ...current,
      [category]: !current[category],
    }))
  }

  const currencies = [
    ...new Set(
      expenses.map(
        (expense) => expense.currency || 'MYR'
      )
    ),
  ]

  const filteredExpenses = expenses.filter((expense) => {
    const currency = expense.currency || 'MYR'

    return (
      !currencyFilter ||
      currency === currencyFilter
    )
  })

  const totalsByCurrency = {}

  for (const expense of filteredExpenses) {
    const currency = expense.currency || 'MYR'

    if (!totalsByCurrency[currency]) {
      totalsByCurrency[currency] = 0
    }

    totalsByCurrency[currency] += Number(expense.amount)
  }

  const groupedByCategory = filteredExpenses.reduce(
    (groups, expense) => {
      const category =
        expense.category || 'Uncategorized'

      if (!groups[category]) {
        groups[category] = []
      }

      groups[category].push(expense)

      return groups
    },
    {}
  )

  const sortedCategories = Object.entries(
    groupedByCategory
  ).sort(([, expensesA], [, expensesB]) => {
    const totalA = expensesA.reduce(
      (total, expense) =>
        total + Number(expense.amount),
      0
    )

    const totalB = expensesB.reduce(
      (total, expense) =>
        total + Number(expense.amount),
      0
    )

    return totalB - totalA
  })

  return (
    <Card
      title={
        <span className="today-expenses-title">
          Expenses
        </span>
      }
      actions={
        <div className="today-expenses-filter">
          <label htmlFor="date-filter">
            Date
          </label>

          <select
            id="date-filter"
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(event.target.value)
            }
          >
            <option value="today">
              Today
            </option>

            <option value="yesterday">
              Yesterday
            </option>

            <option value="this_week">
              This Week
            </option>

            <option value="this_month">
              This Month
            </option>

            <option value="this_year">
              This Year
            </option>

            <option value="last_year">
              Last Year
            </option>

            <option value="custom">
              Custom Range
            </option>
          </select>

          {dateFilter === 'custom' && (
            <>
              <input
                type="date"
                value={customStartDate}
                onChange={(event) =>
                  setCustomStartDate(
                    event.target.value
                  )
                }
              />

              <span>to</span>

              <input
                type="date"
                value={customEndDate}
                onChange={(event) =>
                  setCustomEndDate(
                    event.target.value
                  )
                }
              />
            </>
          )}

          <label htmlFor="currency-filter">
            Currency
          </label>

          <select
            id="currency-filter"
            value={currencyFilter || ''}
            onChange={(event) =>
              setCurrencyFilter(
                event.target.value
              )
            }
          >
            {currencies.map((currency) => (
              <option
                key={currency}
                value={currency}
              >
                {currency}
              </option>
            ))}
          </select>
        </div>
      }
    >
      <div className="today-expenses-total">
        {Object.entries(
          totalsByCurrency
        ).map(([currency, total]) => (
          <strong key={currency}>
            {currency} {total.toFixed(2)}
          </strong>
        ))}
      </div>

      <div className="today-expenses-list">
        {filteredExpenses.length === 0 ? (
          <p>No expenses found.</p>
        ) : (
          sortedCategories.map(
            ([category, categoryExpenses]) => {
              const categoryTotal =
                categoryExpenses.reduce(
                  (total, expense) =>
                    total +
                    Number(expense.amount),
                  0
                )

              const currency =
                categoryExpenses[0]?.currency ||
                'MYR'

              const hasSubcategory =
                categoryExpenses.some(
                  (expense) =>
                    expense.subcategory?.trim()
                )

              const groupedBySubcategory =
                categoryExpenses.reduce(
                  (groups, expense) => {
                    const subcategory =
                      expense.subcategory ||
                      'Uncategorized'

                    if (!groups[subcategory]) {
                      groups[subcategory] = []
                    }

                    groups[subcategory].push(
                      expense
                    )

                    return groups
                  },
                  {}
                )

              const sortedSubcategories =
                Object.entries(
                  groupedBySubcategory
                ).sort(
                  (
                    [, expensesA],
                    [, expensesB]
                  ) => {
                    const totalA =
                      expensesA.reduce(
                        (total, expense) =>
                          total +
                          Number(
                            expense.amount
                          ),
                        0
                      )

                    const totalB =
                      expensesB.reduce(
                        (total, expense) =>
                          total +
                          Number(
                            expense.amount
                          ),
                        0
                      )

                    return totalB - totalA
                  }
                )

              return (
                <div
                  className="today-expense-category"
                  key={category}
                >
                  <div
                    className="today-expense-category-header"
                    onClick={() => {
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
                        {currency}{' '}
                        {categoryTotal.toFixed(
                          2
                        )}
                      </strong>

                      {hasSubcategory && (
                        <span className="today-expense-expand-icon">
                          {expandedCategories[
                            category
                          ]
                            ? '▾'
                            : '▸'}
                        </span>
                      )}
                    </div>
                  </div>

                  {expandedCategories[
                    category
                  ] && (
                    <div className="today-expense-category-items">
                      {sortedSubcategories.map(
                        ([
                          subcategory,
                          subcategoryExpenses,
                        ]) => {
                          const subcategoryTotal =
                            subcategoryExpenses.reduce(
                              (
                                total,
                                expense
                              ) =>
                                total +
                                Number(
                                  expense.amount
                                ),
                              0
                            )

                          const groupedBySubSubcategory =
                            subcategoryExpenses.reduce(
                              (
                                groups,
                                expense
                              ) => {
                                const name =
                                  expense.sub_subcategory?.trim()

                                if (
                                  !name ||
                                  name.toLowerCase() ===
                                    'no description'
                                ) {
                                  const key =
                                    '__others__'

                                  if (
                                    !groups[key]
                                  ) {
                                    groups[key] =
                                      []
                                  }

                                  groups[key].push(
                                    expense
                                  )

                                  return groups
                                }

                                if (
                                  !groups[name]
                                ) {
                                  groups[name] =
                                    []
                                }

                                groups[name].push(
                                  expense
                                )

                                return groups
                              },
                              {}
                            )

                          const actualSubSubcategoryNames =
                            Object.keys(
                              groupedBySubSubcategory
                            ).filter(
                              (name) =>
                                name !==
                                '__others__'
                            )

                          const subSubcategoryItems =
                            Object.entries(
                              groupedBySubSubcategory
                            )
                              .filter(
                                ([name]) => {
                                  if (
                                    name ===
                                    '__others__'
                                  ) {
                                    return (
                                      actualSubSubcategoryNames.length >
                                      0
                                    )
                                  }

                                  return true
                                }
                              )
                              .map(
                                ([
                                  name,
                                  expenses,
                                ]) => ({
                                  type:
                                    name ===
                                    '__others__'
                                      ? 'others'
                                      : 'sub_subcategory',
                                  name:
                                    name ===
                                    '__others__'
                                      ? 'Others'
                                      : name,
                                  amount:
                                    expenses.reduce(
                                      (
                                        total,
                                        expense
                                      ) =>
                                        total +
                                        Number(
                                          expense.amount
                                        ),
                                      0
                                    ),
                                  expense:
                                    expenses[0] ||
                                    null,
                                })
                              )
                              .sort(
                                (a, b) =>
                                  b.amount -
                                  a.amount
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
                                <strong>
                                  {subcategory}
                                </strong>

                                <strong>
                                  {currency}{' '}
                                  {subcategoryTotal.toFixed(
                                    2
                                  )}
                                </strong>
                              </div>

                              {subSubcategoryItems.length >
                                0 && (
                                <div className="today-expense-sub-subcategory-list">
                                  {subSubcategoryItems.map(
                                    (item) => {
                                      if (
                                        item.type ===
                                        'others'
                                      ) {
                                        return (
                                          <div
                                            className="today-expense-sub-subcategory-item"
                                            key="others"
                                          >
                                            <span>
                                              Others
                                            </span>

                                            <strong>
                                              {
                                                currency
                                              }{' '}
                                              {item.amount.toFixed(
                                                2
                                              )}
                                            </strong>
                                          </div>
                                        )
                                      }

                                      return (
                                        <div
                                          className="today-expense-sub-subcategory-item"
                                          key={
                                            item
                                              .expense
                                              .id
                                          }
                                          onClick={() =>
                                            navigate(
                                              `/expenses?date=today&search=${encodeURIComponent(
                                                item
                                                  .expense
                                                  .sub_subcategory
                                              )}`
                                            )
                                          }
                                        >
                                          <span>
                                            {
                                              item
                                                .expense
                                                .sub_subcategory
                                            }
                                          </span>

                                          <strong>
                                            {item
                                              .expense
                                              .currency ||
                                              'MYR'}{' '}
                                            {item.amount.toFixed(
                                              2
                                            )}
                                          </strong>
                                        </div>
                                      )
                                    }
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        }
                      )}
                    </div>
                  )}
                </div>
              )
            }
          )
        )}
      </div>
    </Card>
  )
}

export default ExpensesCard

