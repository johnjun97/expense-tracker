import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import './Navbar.css'

function Navbar() {
    async function handleLogout() {
        const { error } = await supabase.auth.signOut()

        if (error) {
            console.error('Logout failed:', error)
        }
    }

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                Expense Tracker
            </div>

            <div className="navbar-links">
                <Link to="/">Home</Link>
                <Link to="/expenses">Expenses</Link>
                <Link to="/charts">Charts</Link>
                <button onClick={handleLogout}>Logout</button>
            </div>
        </nav>
    )
}

export default Navbar