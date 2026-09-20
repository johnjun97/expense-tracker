
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar/Navbar'
import Loading from '../../components/Loading/Loading'
import ExpensesCard from './components/ExpensesCard'
import './home.css'

function Home() {
  const [expenses, setExpenses] = useState([])
  const [currencyFilter, setCurrencyFilter] = useState(null)
  const [dateFilter, setDateFilter] = useState('today')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadExpenses() {
      setLoading(true)
      setError('')

      const today = new Date()

      const formatDate = (date) =>
        date.toISOString().split('T')[0]

      let startDate
      let endDate

      switch (dateFilter) {
        case 'today':
          startDate = new Date(today)
          endDate = new Date(today)
          break

        case 'yesterday':
          startDate = new Date(today)
          startDate.setDate(startDate.getDate() - 1)
          endDate = new Date(startDate)
          break

        case 'this_week': {
          startDate = new Date(today)

          const day = startDate.getDay()
          const daysSinceMonday =
            day === 0 ? 6 : day - 1

          startDate.setDate(
            startDate.getDate() -
            daysSinceMonday
          )

          endDate = new Date(today)
          break
        }

        case 'this_month':
          startDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            1
          )

          endDate = new Date(today)
          break

        case 'this_year':
          startDate = new Date(
            today.getFullYear(),
            0,
            1
          )

          endDate = new Date(today)
          break

        case 'last_year':
          startDate = new Date(
            today.getFullYear() - 1,
            0,
            1
          )

          endDate = new Date(
            today.getFullYear() - 1,
            11,
            31
          )
          break

        case 'custom':
          if (
            !customStartDate ||
            !customEndDate
          ) {
            setExpenses([])
            setLoading(false)
            return
          }

          startDate = new Date(customStartDate)
          endDate = new Date(customEndDate)
          break

        default:
          startDate = new Date(today)
          endDate = new Date(today)
      }

      const start = formatDate(startDate)
      const end = formatDate(endDate)

      const { data, error } = await supabase
        .from('expenses_tracker_expenses')
        .select('*')
        .gte('expense_date', start)
        .lte('expense_date', end)
        .order('created_at', {
          ascending: false,
        })

      if (error) {
        console.error(
          'Failed to load expenses:',
          error
        )

        setError(error.message)
        setLoading(false)
        return
      }

      const loadedExpenses = data || []

      setExpenses(loadedExpenses)

      if (loadedExpenses.length > 0) {
        setCurrencyFilter(
          loadedExpenses[0].currency || 'MYR'
        )
      } else {
        setCurrencyFilter(null)
      }

      setLoading(false)
    }

    loadExpenses()
  }, [
    dateFilter,
    customStartDate,
    customEndDate,
  ])

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

  return (
    <>
      <Navbar />

      <main className="home-page">
        <div className="home-content">
          <h1>Home</h1>

          <ExpensesCard
            expenses={expenses}
            currencyFilter={currencyFilter}
            setCurrencyFilter={
              setCurrencyFilter
            }
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            customStartDate={
              customStartDate
            }
            setCustomStartDate={
              setCustomStartDate
            }
            customEndDate={customEndDate}
            setCustomEndDate={
              setCustomEndDate
            }
          />
        </div>
      </main>
    </>
  )
}

export default Home