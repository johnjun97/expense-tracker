import { useEffect, useMemo, useState } from 'react'
import {
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import { supabase } from '../../../lib/supabase'
import './ExpensesChartCard.css'

function ExpensesChartCard() {
    const [chartFilter, setChartFilter] =
        useState('last_7_days')

    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        async function loadChartExpenses() {
            setLoading(true)
            setError('')

            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const startDate = new Date(today)
            const endDate = new Date(today)

            switch (chartFilter) {
                case 'last_7_days':
                    startDate.setDate(
                        startDate.getDate() - 6
                    )
                    break

                case 'this_month':
                    startDate.setDate(1)
                    break

                case 'last_month':
                    startDate.setMonth(
                        startDate.getMonth() - 1,
                        1
                    )
                    endDate.setDate(0)
                    break

                case 'this_quarter': {
                    const currentMonth =
                        startDate.getMonth()

                    const quarterStartMonth =
                        Math.floor(currentMonth / 3) * 3

                    startDate.setMonth(
                        quarterStartMonth,
                        1
                    )
                    break
                }

                case 'last_6_months':
                    startDate.setMonth(
                        startDate.getMonth() - 5,
                        1
                    )
                    break

                case 'this_year':
                    startDate.setMonth(0, 1)
                    break

                case 'last_year':
                    startDate.setFullYear(
                        startDate.getFullYear() - 1,
                        0,
                        1
                    )

                    endDate.setFullYear(
                        endDate.getFullYear() - 1,
                        11,
                        31
                    )
                    break

                case 'all_time':
                    startDate.setFullYear(2000, 0, 1)
                    break

                default:
                    startDate.setDate(
                        startDate.getDate() - 6
                    )
            }

            const formatDate = (date) => {
                const year = date.getFullYear()
                const month = String(date.getMonth() + 1).padStart(2, '0')
                const day = String(date.getDate()).padStart(2, '0')

                return `${year}-${month}-${day}`
            }

            const start = formatDate(startDate)
            const end = formatDate(endDate)

            const { data, error } = await supabase
                .from('expenses_tracker_expenses')
                .select('amount, expense_date, currency')
                .gte('expense_date', start)
                .lte('expense_date', end)
                .order('expense_date', {
                    ascending: true,
                })

            if (error) {
                console.error(
                    'Failed to load chart expenses:',
                    error
                )

                setError(error.message)
                setExpenses([])
                setLoading(false)
                return
            }

            setExpenses(data || [])
            setLoading(false)
        }

        loadChartExpenses()
    }, [chartFilter])


    const chartData = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const startDate = new Date(today)
        const endDate = new Date(today)

        let groupByMonth = false

        switch (chartFilter) {
            case 'last_7_days':
                startDate.setDate(
                    startDate.getDate() - 6
                )
                break

            case 'this_month':
                startDate.setDate(1)
                break

            case 'last_month':
                startDate.setMonth(
                    startDate.getMonth() - 1,
                    1
                )
                endDate.setDate(0)
                break

            case 'this_quarter': {
                const currentMonth =
                    startDate.getMonth()

                const quarterStartMonth =
                    Math.floor(currentMonth / 3) * 3

                startDate.setMonth(
                    quarterStartMonth,
                    1
                )
                break
            }

            case 'last_6_months':
                startDate.setMonth(
                    startDate.getMonth() - 5,
                    1
                )
                groupByMonth = true
                break

            case 'this_year':
                startDate.setMonth(0, 1)
                groupByMonth = true
                break

            case 'last_year':
                startDate.setFullYear(
                    startDate.getFullYear() - 1,
                    0,
                    1
                )

                endDate.setFullYear(
                    endDate.getFullYear() - 1,
                    11,
                    31
                )

                groupByMonth = true
                break

            case 'all_time':
                startDate.setFullYear(2000, 0, 1)
                groupByMonth = true
                break

            default:
                startDate.setDate(
                    startDate.getDate() - 6
                )
        }

        const totals = {}

        if (groupByMonth) {
            // Create monthly entries
            const current = new Date(startDate)

            current.setDate(1)

            while (current <= endDate) {
                const year = current.getFullYear()
                const month = current.getMonth()

                const key = `${year}-${String(
                    month + 1
                ).padStart(2, '0')}`

                totals[key] = 0

                current.setMonth(month + 1)
            }

            // Add expenses to their month
            expenses.forEach((expense) => {
                const date = new Date(
                    `${expense.expense_date}T00:00:00`
                )

                const key = `${date.getFullYear()}-${String(
                    date.getMonth() + 1
                ).padStart(2, '0')}`

                if (totals[key] !== undefined) {
                    totals[key] +=
                        Number(expense.amount) || 0
                }
            })

            return Object.entries(totals).map(
                ([date, amount]) => {
                    const [year, month] =
                        date.split('-')

                    const label = new Date(
                        Number(year),
                        Number(month) - 1,
                        1
                    ).toLocaleDateString('en-MY', {
                        month: 'short',
                        year: 'numeric',
                    })

                    return {
                        date,
                        label,
                        amount: Number(
                            amount.toFixed(2)
                        ),
                    }
                }
            )
        }

        // Create daily entries
        const current = new Date(startDate)

        while (current <= endDate) {
            const year = current.getFullYear()
            const month = String(current.getMonth() + 1).padStart(2, '0')
            const day = String(current.getDate()).padStart(2, '0')

            const dateKey = `${year}-${month}-${day}`

            totals[dateKey] = 0

            current.setDate(
                current.getDate() + 1
            )
        }

        // Add expenses to their day
        expenses.forEach((expense) => {
            const dateKey = expense.expense_date

            if (totals[dateKey] !== undefined) {
                totals[dateKey] +=
                    Number(expense.amount) || 0
            }
        })

        return Object.entries(totals).map(
            ([date, amount]) => ({
                date,
                label: new Date(
                    `${date}T00:00:00`
                ).toLocaleDateString('en-MY', {
                    day: 'numeric',
                    month: 'short',
                }),
                amount: Number(
                    amount.toFixed(2)
                ),
            })
        )
    }, [expenses, chartFilter])



    if (error) {
        return (
            <div className="expenses-chart-card">
                <div className="expenses-chart-header">
                    <div>
                        <h2>Expenses Overview</h2>

                        <p>
                            {[
                                'last_6_months',
                                'this_year',
                                'last_year',
                                'all_time',
                            ].includes(chartFilter)
                                ? 'Monthly spending'
                                : 'Daily spending'}
                        </p>
                    </div>

                    <select
                        value={chartFilter}
                        onChange={(e) =>
                            setChartFilter(e.target.value)
                        }
                    >
                        <option value="last_7_days">
                            Last 7 Days
                        </option>

                        <option value="this_month">
                            This Month
                        </option>

                        <option value="last_month">
                            Last Month
                        </option>

                        <option value="this_quarter">
                            This Quarter
                        </option>

                        <option value="last_6_months">
                            Last 6 Months
                        </option>

                        <option value="this_year">
                            This Year
                        </option>

                        <option value="last_year">
                            Last Year
                        </option>

                        <option value="all_time">
                            All Time
                        </option>
                    </select>
                </div>

                <p className="expenses-chart-error">
                    Error: {error}
                </p>
            </div>
        )
    }

    return (
        <div className="expenses-chart-card">
            <div className="expenses-chart-header">
                <div>
                    <h2>Expenses Overview</h2>

                    <p>
                        {[
                            'last_6_months',
                            'this_year',
                            'last_year',
                            'all_time',
                        ].includes(chartFilter)
                            ? 'Monthly spending'
                            : 'Daily spending'}
                    </p>
                </div>

                <select
                    value={chartFilter}
                    onChange={(e) =>
                        setChartFilter(e.target.value)
                    }
                >
                    <option value="last_7_days">
                        Last 7 Days
                    </option>

                    <option value="this_month">
                        This Month
                    </option>

                    <option value="last_month">
                        Last Month
                    </option>

                    <option value="this_quarter">
                        This Quarter
                    </option>

                    <option value="last_6_months">
                        Last 6 Months
                    </option>

                    <option value="this_year">
                        This Year
                    </option>

                    <option value="last_year">
                        Last Year
                    </option>

                    <option value="all_time">
                        All Time
                    </option>
                </select>
            </div>

            {loading ? (
                <div className="expenses-chart-loading">
                    Loading...
                </div>
            ) : (
                <>
                    <div className="expenses-chart">
                        <ResponsiveContainer
                            width="100%"
                            height={300}
                        >
                            <BarChart
                                data={chartData}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: 0,
                                    bottom: 0,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                />

                                <XAxis
                                    dataKey="label"
                                    tickLine={false}
                                />

                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                />

                                <Tooltip
                                    formatter={(value) => [
                                        `RM ${Number(value).toFixed(2)}`,
                                        'Expenses',
                                    ]}
                                />

                                <Bar
                                    dataKey="amount"
                                    name="Expenses"
                                    radius={[4, 4, 0, 0]}
                                >
                                    {chartData.map(
                                        (entry, index) => {
                                            const maxAmount =
                                                Math.max(
                                                    ...chartData.map(
                                                        (item) =>
                                                            item.amount
                                                    )
                                                )

                                            const intensity =
                                                maxAmount === 0
                                                    ? 0
                                                    : entry.amount /
                                                    maxAmount

                                            const lightness =
                                                80 -
                                                intensity * 45

                                            return (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={`hsl(220, 70%, ${lightness}%)`}
                                                />
                                            )
                                        }
                                    )}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </div>
    )
}

export default ExpensesChartCard