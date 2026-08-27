const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true'

if (!DEBUG_MODE) {
  console.log = () => {}
}