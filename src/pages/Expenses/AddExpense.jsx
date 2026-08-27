import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar/Navbar'
import ExpenseForm from "./components/ExpenseForm/ExpenseForm.jsx"

function AddExpense() {
  const navigate = useNavigate()

  function handleExpenseAdded() {
    navigate('/expenses')
  }

  return (
    <>
      <Navbar />

      <div className="expenses-page">
        <ExpenseForm onExpenseAdded={handleExpenseAdded} />
      </div>
    </>
  )
}

export default AddExpense