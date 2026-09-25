import Navbar from '../../components/Navbar/Navbar'
import ExpensesCard from './components/ExpensesCard'
import ExpensesChartCard from './components/ExpensesChartCard'
import './home.css'

function Home() {

  return (
    <>
      <Navbar />

      <main className="home-page">
        <div className="home-content">
          <h1>Home</h1>

<ExpensesCard />

<ExpensesChartCard />
        </div>
      </main>
    </>
  )
}

export default Home