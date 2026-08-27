import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar/Navbar'
import Loading from '../../components/Loading/Loading'
import './expenses.css'

function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const navigate = useNavigate()

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

        {expenses.length === 0 ? (
          <p>No expenses recorded yet.</p>
        ) : (
          <div className="expense-list">
            {expenses.map((expense) => (
              <div className="expense-card" key={expense.id}>
                <div className="expense-card-header">
                  <strong>{expense.category}</strong>

                  <strong>
                    RM {Number(expense.amount).toFixed(2)}
                  </strong>
                </div>

                {expense.subcategory && (
                  <p className="expense-subcategory">
                    {expense.subcategory}
                  </p>
                )}

                <p className="expense-date">
                  {expense.expense_date}
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