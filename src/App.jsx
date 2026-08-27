import { useEffect } from 'react'
import { supabase } from './lib/supabase'

function App() {
  useEffect(() => {
    console.log('App loaded')

    async function testConnection() {
      const { error } = await supabase.auth.getSession()

      if (error) {
        console.error('Supabase connection failed:', error)
        return
      }

      console.log('Supabase connection successful')
    }

    testConnection()
  }, [])

  return (
    <div>
      <h1>Expense Tracker</h1>
      <p>Supabase connection test</p>
    </div>
  )
}

export default App