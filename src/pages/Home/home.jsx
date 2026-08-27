import Navbar from '../../components/Navbar/Navbar'
import './home.css'

function Home() {
  return (
    <div className="home-page">
      <Navbar />

      <main className="home-content">
        <h1>Home</h1>
        <p>Welcome to your expense tracker.</p>
      </main>
    </div>
  )
}

export default Home