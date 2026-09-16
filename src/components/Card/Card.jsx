import './Card.css'

function Card({ title, actions, children }) {
  return (
    <div className="card">
      {(title || actions) && (
        <div className="card-header">
          {title && <h2 className="card-title">{title}</h2>}

          {actions && (
            <div className="card-actions">
              {actions}
            </div>
          )}
        </div>
      )}

      <div className="card-content">
        {children}
      </div>
    </div>
  )
}

export default Card