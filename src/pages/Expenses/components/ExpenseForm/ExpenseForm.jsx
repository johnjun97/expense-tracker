import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import './ExpenseForm.css'

function ExpenseForm({
  expense = null,
  onExpenseSaved,
  onCancel,
}) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [categorySuggestions, setCategorySuggestions] = useState([])
  const [categoryOpen, setCategoryOpen] = useState(false)
  const categoryRef = useRef(null)
  const subcategoryRef = useRef(null)
  const [subcategory, setSubcategory] = useState('')
  const [subcategorySuggestions, setSubcategorySuggestions] = useState([])
  const [subcategoryOpen, setSubcategoryOpen] = useState(false)
const [expenseDate, setExpenseDate] = useState(new Date())
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
setExpenseDate(
  expense.expense_date
    ? new Date(`${expense.expense_date}T00:00:00`)
    : null
)
    setNote(expense.note ?? '')
  }, [expense])

  useEffect(() => {
    async function loadCategorySuggestions() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return
      }

      const { data, error } = await supabase
        .from('expenses_tracker_expenses')
        .select('category, expense_date')
        .eq('user_id', user.id)
        .not('category', 'is', null)
        .order('expense_date', { ascending: false })

      if (error) {
        console.error('Failed to load category suggestions:', error)
        return
      }

      const uniqueCategories = []
      const seen = new Set()

      for (const expense of data) {
        const category = expense.category.trim()

        if (!category || seen.has(category.toLowerCase())) {
          continue
        }

        seen.add(category.toLowerCase())
        uniqueCategories.push(category)
      }

      setCategorySuggestions(uniqueCategories)
    }

    loadCategorySuggestions()
  }, [])

  useEffect(() => {
    async function loadSubcategorySuggestions() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !category.trim()) {
        setSubcategorySuggestions([])
        return
      }

      const { data, error } = await supabase
        .from('expenses_tracker_expenses')
        .select('subcategory, expense_date')
        .eq('user_id', user.id)
        .eq('category', category.trim())
        .not('subcategory', 'is', null)
        .order('expense_date', { ascending: false })

      if (error) {
        console.error(
          'Failed to load subcategory suggestions:',
          error
        )
        return
      }

      const uniqueSubcategories = []
      const seen = new Set()

      for (const expense of data) {
        const subcategory = expense.subcategory?.trim()

        if (
          !subcategory ||
          seen.has(subcategory.toLowerCase())
        ) {
          continue
        }

        seen.add(subcategory.toLowerCase())
        uniqueSubcategories.push(subcategory)
      }

      setSubcategorySuggestions(uniqueSubcategories)
    }

    loadSubcategorySuggestions()
  }, [category])

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        categoryRef.current &&
        !categoryRef.current.contains(event.target)
      ) {
        setCategoryOpen(false)
      }

      if (
        subcategoryRef.current &&
        !subcategoryRef.current.contains(event.target)
      ) {
        setSubcategoryOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
  expense_date: expenseDate
    ? expenseDate.toISOString().split('T')[0]
    : null,
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
      <div className="expense-form-header">
        <h2>{isEditMode ? 'Edit Expense' : 'Add Expense'}</h2>

        {onCancel && (
          <button
            type="button"
            className="back-button"
            onClick={onCancel}
          >
            Back
          </button>
        )}
      </div>

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

          <div className="category-dropdown" ref={categoryRef}>
            <input
              id="category"
              type="text"
              value={category}
              autoComplete="off"
              onChange={(event) => {
                setCategory(event.target.value)
                setSubcategory('')
                setSubcategoryOpen(false)
                setCategoryOpen(true)
              }}
              onFocus={() => setCategoryOpen(true)}
              placeholder="Enter category"
              required
            />

            {categoryOpen && (
              <div className="category-dropdown-menu">
                {categorySuggestions
                  .filter((item) =>
                    item.toLowerCase().includes(category.toLowerCase())
                  )
                  .map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="category-dropdown-item"
                      onClick={() => {
                        setCategory(item)
                        setSubcategory('')
                        setSubcategoryOpen(false)
                        setCategoryOpen(false)
                      }}
                    >
                      {item}
                    </button>
                  ))}

                {categorySuggestions.filter((item) =>
                  item.toLowerCase().includes(category.toLowerCase())
                ).length === 0 && !category && (
                    <div className="category-dropdown-empty">
                      No suggestions yet
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="subcategory">Subcategory</label>

          <div className="category-dropdown" ref={subcategoryRef}>
            <input
              id="subcategory"
              type="text"
              value={subcategory}
              onChange={(event) => {
                setSubcategory(event.target.value)
                setSubcategoryOpen(true)
              }}
              onFocus={() => {
                if (category.trim()) {
                  setSubcategoryOpen(true)
                }
              }}
              placeholder={category ? 'Optional' : 'Select category first'}
              disabled={!category.trim()}
            />

            {subcategoryOpen && category.trim() && (
              <div className="category-dropdown-menu">
                {subcategorySuggestions
                  .filter((item) =>
                    item
                      .toLowerCase()
                      .includes(subcategory.toLowerCase())
                  )
                  .map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="category-dropdown-item"
                      onClick={() => {
                        setSubcategory(item)
                        setSubcategoryOpen(false)
                      }}
                    >
                      {item}
                    </button>
                  ))}

                {subcategorySuggestions.filter((item) =>
                  item
                    .toLowerCase()
                    .includes(subcategory.toLowerCase())
                ).length === 0 && !subcategory && (
                    <div className="category-dropdown-empty">
                      No suggestions yet
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="expense-date">Date</label>
<DatePicker
  id="expense-date"
  selected={expenseDate}
  onChange={(date) => setExpenseDate(date)}
  dateFormat="dd/MM/yyyy"
  placeholderText="DD/MM/YYYY"
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