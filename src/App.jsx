import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import WarpPage from './pages/WarpPage'
import InventoryPage from './pages/InventoryPage'
import ShopPage from './pages/ShopPage'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <Routes>
        <Route path="/" element={<WarpPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/shop" element={<ShopPage />} />
      </Routes>
    </div>
  )
}
