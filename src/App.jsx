import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'

import Login from './pages/Login/login.jsx'
import Home from './pages/Home/home.jsx'
import Expenses from './pages/Expenses/expenses.jsx'
import AddExpense from './pages/Expenses/AddExpense.jsx'
import EditExpense from './pages/Expenses/EditExpense.jsx'
import Charts from './pages/Charts/charts.jsx'
import Loading from './components/Loading/Loading.jsx'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getSession() {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Failed to get session:', error)
      }

      setSession(data.session)
      setLoading(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

if (loading) {
  return <Loading />
}

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={session ? <Navigate to="/" replace /> : <Login />}
        />

        <Route
          path="/"
          element={session ? <Home /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/expenses"
          element={session ? <Expenses /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/expenses/add"
          element={session ? <AddExpense /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/expenses/edit/:id"
          element={session ? <EditExpense /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/charts"
          element={session ? <Charts /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App