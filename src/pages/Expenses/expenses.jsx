import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar/Navbar'
import Loading from '../../components/Loading/Loading'
import { formatDate } from '../../utils/formatDate'
import './expenses.css'


function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categorySuggestions, setCategorySuggestions] = useState([])

  const navigate = useNavigate()

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

    const searchableDate = dateParts.length === 3
      ? `${Number(dateParts[2])}/${Number(dateParts[1])}/${dateParts[0]}`
      : ''

    const amountText = Number(expense.amount).toFixed(2)

    const matchesSearch =
      expense.category?.toLowerCase().includes(searchText) ||
      expense.subcategory?.toLowerCase().includes(searchText) ||
      expense.note?.toLowerCase().includes(searchText) ||
      amountText.includes(searchText) ||
      formattedDate.includes(searchText) ||
      searchableDate.includes(searchText)

    const matchesCategory =
      !categoryFilter || expense.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  useEffect(() => {
    async function loadExpenses() {
      const { data, error } = await supabase
        .from('expenses_tracker_expenses')
        .select('*')
        .order('expense_date', { ascending: false })

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
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="">All categories</option>

            {categorySuggestions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

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
                      RM {Number(expense.amount).toFixed(2)}
                    </strong>

                    <button
                      className="edit-expense-button"
                      onClick={() => navigate(`/expenses/edit/${expense.id}`)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-expense-button"
                      onClick={() => handleDelete(expense.id)}
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