import './Loading.css'

function Loading({ text = 'Loading...' }) {
  return (
    <div className="loading-overlay">
      <div className="loading-box">
        <p>{text}</p>
      </div>
    </div>
  )
}

export default Loading