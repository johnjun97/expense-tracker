export function formatDate(date) {
  if (!date) {
    return ''
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB')
}