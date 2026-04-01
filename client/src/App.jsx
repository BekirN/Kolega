import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Shop from './pages/Shop'
import NewShopItem from './pages/NewShopItem'
import ShopItemDetail from './pages/ShopItemDetail'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/new" element={<NewShopItem />} />
        <Route path="/shop/:id" element={<ShopItemDetail />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App