import { Link } from 'react-router-dom'
import usePokeStore from '../store/usePokeStore'

export default function Navbar() {
  const jade = usePokeStore((s) => s.jade)
  const inventoryCount = usePokeStore((s) => s.inventory.length) // derived — not stored separately

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
      <span className="text-lg font-bold text-cyan-400">PokeWarp</span>
      <div className="flex gap-6">
        <Link to="/" className="hover:text-cyan-400 transition-colors">Warp</Link>
        <Link to="/inventory" className="hover:text-cyan-400 transition-colors">
          Inventory ({inventoryCount})
        </Link>
        <Link to="/shop" className="hover:text-cyan-400 transition-colors">Shop</Link>
      </div>
      <span className="text-cyan-300 font-mono">{jade} jade</span>
    </nav>
  )
}
