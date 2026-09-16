import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar/Navbar'
import Loading from '../../components/Loading/Loading'
import { formatDate } from '../../utils/formatDate'
import './expenses.css'

function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categorySuggestions, setCategorySuggestions] = useState([])

  const navigate = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams()

  const urlSearch = searchParams.get('search') || ''
  const urlDate = searchParams.get('date') || ''
  const urlFrom = searchParams.get('from') || ''
  const urlTo = searchParams.get('to') || ''

  const [search, setSearch] = useState(urlSearch)
  const [dateFilter, setDateFilter] = useState(urlDate)
  const [fromDate, setFromDate] = useState(urlFrom)
  const [toDate, setToDate] = useState(urlTo)

  async function handleDelete(expenseId) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this expense?'
    )

    if (!confirmed) {
      return
    }

    const { error } = await supabase
      .from('expenses_tracker_expenses')
      .delete()
      .eq('id', expenseId)

    if (error) {
      console.error('Failed to delete expense:', error)
      setError(error.message)
      return
    }

    setExpenses((currentExpenses) =>
      currentExpenses.filter((expense) => expense.id !== expenseId)
    )
  }

  const filteredExpenses = expenses.filter((expense) => {
    const searchText = search.toLowerCase()

    const formattedDate = expense.expense_date
      ? formatDate(expense.expense_date)
      : ''

    const dateParts = expense.expense_date?.split('-') || []

    const searchableDate =
      dateParts.length === 3
        ? `${Number(dateParts[2])}/${Number(dateParts[1])}/${dateParts[0]}`
        : ''

    const amountText = Number(expense.amount).toFixed(2)

    const matchesSearch =
      expense.category?.toLowerCase().includes(searchText) ||
      expense.subcategory?.toLowerCase().includes(searchText) ||
      expense.sub_subcategory?.toLowerCase().includes(searchText) ||
      expense.note?.toLowerCase().includes(searchText) ||
      amountText.includes(searchText) ||
      formattedDate.includes(searchText) ||
      searchableDate.includes(searchText)

    const matchesCategory =
      !categoryFilter || expense.category === categoryFilter

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const expenseDate = new Date(
      `${expense.expense_date}T00:00:00`
    )
    expenseDate.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const startOfWeek = new Date(today)
    const dayOfWeek = today.getDay()
    const daysSinceMonday =
      dayOfWeek === 0 ? 6 : dayOfWeek - 1

    startOfWeek.setDate(
      today.getDate() - daysSinceMonday
    )

    const startOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    )

    let matchesDate = true

    if (dateFilter === 'today') {
      matchesDate =
        expenseDate.getTime() === today.getTime()
    }

    if (dateFilter === 'yesterday') {
      matchesDate =
        expenseDate.getTime() === yesterday.getTime()
    }

    if (dateFilter === 'this-week') {
      matchesDate =
        expenseDate >= startOfWeek &&
        expenseDate <= today
    }

    if (dateFilter === 'this-month') {
      matchesDate =
        expenseDate.getFullYear() === today.getFullYear() &&
        expenseDate.getMonth() === today.getMonth()
    }

    if (dateFilter === 'custom-range') {
      if (fromDate) {
        const selectedFromDate = new Date(
          `${fromDate}T00:00:00`
        )

        matchesDate =
          matchesDate &&
          expenseDate >= selectedFromDate
      }

      if (toDate) {
        const selectedToDate = new Date(
          `${toDate}T00:00:00`
        )

        matchesDate =
          matchesDate &&
          expenseDate <= selectedToDate
      }
    }

    return matchesSearch && matchesCategory && matchesDate
  })

  useEffect(() => {
    async function loadExpenses() {
      const { data, error } = await supabase
        .from('expenses_tracker_expenses')
        .select('*')
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load expenses:', error)
        setError(error.message)
        setLoading(false)
        return
      }

      setExpenses(data)

      const uniqueCategories = []
      const seen = new Set()

      for (const expense of data) {
        const category = expense.category?.trim()

        if (!category) {
          continue
        }

        const key = category.toLowerCase()

        if (seen.has(key)) {
          continue
        }

        seen.add(key)
        uniqueCategories.push(category)
      }

      setCategorySuggestions(uniqueCategories)
      setLoading(false)
    }

    loadExpenses()
  }, [])

  useEffect(() => {
    setSearch(urlSearch)
    setDateFilter(urlDate)
    setFromDate(urlFrom)
    setToDate(urlTo)
  }, [urlSearch, urlDate, urlFrom, urlTo])

  function handleDateFilterChange(value) {
    setDateFilter(value)

    const params = new URLSearchParams(searchParams)

    if (value) {
      params.set('date', value)
    } else {
      params.delete('date')
      params.delete('from')
      params.delete('to')

      setFromDate('')
      setToDate('')
    }

    setSearchParams(params)
  }

  function handleFromDateChange(value) {
    setFromDate(value)

    const params = new URLSearchParams(searchParams)

    if (value) {
      params.set('from', value)
    } else {
      params.delete('from')
    }

    setSearchParams(params)
  }

  function handleToDateChange(value) {
    setToDate(value)

    const params = new URLSearchParams(searchParams)

    if (value) {
      params.set('to', value)
    } else {
      params.delete('to')
    }

    setSearchParams(params)
  }

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

        <div className="expenses-page">
          <p>Error: {error}</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />

      <div className="expenses-page">
        <div className="expenses-header">
          <h1>Expenses</h1>

          <button
            className="add-expense-button"
            onClick={() => navigate('/expenses/add')}
          >
            Add Expense
          </button>
        </div>

        <div className="expenses-filters">
          <input
            type="search"
            placeholder="Search expenses..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={dateFilter}
            onChange={(event) =>
              handleDateFilterChange(event.target.value)
            }
          >
            <option value="">All dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this-week">This week</option>
            <option value="this-month">This month</option>
            <option value="custom-range">Custom range</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
          >
            <option value="">All categories</option>

            {categorySuggestions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {dateFilter === 'custom-range' && (
          <div className="expenses-custom-date">
            <label>
              From
              <input
                type="date"
                value={fromDate}
                onChange={(event) =>
                  handleFromDateChange(event.target.value)
                }
              />
            </label>

            <label>
              To
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) =>
                  handleToDateChange(event.target.value)
                }
              />
            </label>
          </div>
        )}

        {filteredExpenses.length === 0 ? (
          <p>No matching expenses found.</p>
        ) : (
          <div className="expense-list">
            {filteredExpenses.map((expense) => (
              <div className="expense-card" key={expense.id}>
                <div className="expense-card-header">
                  <strong>{expense.category}</strong>

                  <div className="expense-card-actions">
                    <strong>
                      {expense.currency || 'MYR'}{' '}
                      {Number(expense.amount).toFixed(2)}
                    </strong>

                    <button
                      className="edit-expense-button"
                      onClick={() =>
                        navigate(
                          `/expenses/edit/${expense.id}`
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="delete-expense-button"
                      onClick={() =>
                        handleDelete(expense.id)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {expense.subcategory && (
                  <p className="expense-subcategory">
                    {expense.subcategory}
                  </p>
                )}

                {expense.sub_subcategory && (
                  <p className="expense-sub-subcategory">
                    {expense.sub_subcategory}
                  </p>
                )}

                <p className="expense-date">
                  {formatDate(expense.expense_date)}
                </p>

                {expense.note && (
                  <p className="expense-note">
                    {expense.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default Expenses