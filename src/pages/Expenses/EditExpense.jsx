import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar/Navbar'
import Loading from '../../components/Loading/Loading'
import ExpenseForm from './components/ExpenseForm/ExpenseForm'

function EditExpense() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [expense, setExpense] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadExpense() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        navigate('/login', { replace: true })
        return
      }

      const { data, error } = await supabase
        .from('expenses_tracker_expenses')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Failed to load expense:', error)
        setError(error.message)
        setLoading(false)
        return
      }

      setExpense(data)
      setLoading(false)
    }

    loadExpense()
  }, [id, navigate])

  function handleExpenseSaved() {
    navigate('/expenses')
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
        <ExpenseForm
          expense={expense}
          onExpenseSaved={handleExpenseSaved}
        />
      </div>
    </>
  )
}

export default EditExpense