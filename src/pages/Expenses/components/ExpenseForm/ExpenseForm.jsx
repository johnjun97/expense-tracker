import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import './ExpenseForm.css'

const categories = [
  'Food',
  'Transport',
  'Bills',
  'Shopping',
  'Entertainment',
  'Health',
  'Other',
]

function ExpenseForm({
  expense = null,
  onExpenseSaved,
}) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEditMode = Boolean(expense)

  useEffect(() => {
    if (!expense) {
      return
    }

    setAmount(expense.amount ?? '')
    setCategory(expense.category ?? '')
    setSubcategory(expense.subcategory ?? '')
    setExpenseDate(expense.expense_date ?? '')
    setNote(expense.note ?? '')
  }, [expense])

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('You are not logged in.')
      setLoading(false)
      return
    }

    const expenseData = {
      amount: Number(amount),
      category,
      subcategory: subcategory || null,
      expense_date: expenseDate,
      note: note || null,
    }

    let data
    let saveError

    if (isEditMode) {
      const result = await supabase
        .from('expenses_tracker_expenses')
        .update(expenseData)
        .eq('id', expense.id)
        .eq('user_id', user.id)
        .select()
        .single()

      data = result.data
      saveError = result.error
    } else {
      const result = await supabase
        .from('expenses_tracker_expenses')
        .insert({
          user_id: user.id,
          ...expenseData,
        })
        .select()
        .single()

      data = result.data
      saveError = result.error
    }

    if (saveError) {
      console.error(
        isEditMode
          ? 'Failed to update expense:'
          : 'Failed to add expense:',
        saveError
      )

      setError(saveError.message)
      setLoading(false)
      return
    }

    console.log(
      isEditMode ? 'Expense updated:' : 'Expense added:',
      data
    )

    setLoading(false)

    if (onExpenseSaved) {
      onExpenseSaved(data)
    }
  }

  return (
    <div className="expense-form">
      <h2>{isEditMode ? 'Edit Expense' : 'Add Expense'}</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            required
          >
            <option value="">Select category</option>

            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="subcategory">Subcategory</label>
          <input
            id="subcategory"
            type="text"
            value={subcategory}
            onChange={(event) => setSubcategory(event.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="form-group">
          <label htmlFor="expense-date">Date</label>
          <input
            id="expense-date"
            type="date"
            value={expenseDate}
            onChange={(event) => setExpenseDate(event.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="note">Note</label>
          <textarea
            id="note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional"
            rows="3"
          />
        </div>

        {error && (
          <p className="expense-form-error">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading
            ? 'Saving...'
            : isEditMode
              ? 'Save Changes'
              : 'Add Expense'}
        </button>
      </form>
    </div>
  )
}

export default ExpenseForm