import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { NotificationProvider } from './context/NotificationContext'
import Home from './pages/Home'
import Layout from './components/Layout'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Shop from './pages/Shop'
import NewShopItem from './pages/NewShopItem'
import ShopItemDetail from './pages/ShopItemDetail'
import Companies from './pages/Companies'
import CompanyDetail from './pages/CompanyDetail'
import Tutoring from './pages/Tutoring'
import TutorDetail from './pages/TutorDetail'
import BecomeTutor from './pages/BecomeTutor'
import MyBookings from './pages/MyBookings'
import Community from './pages/Community'
import PostDetail from './pages/PostDetail'
import NewPost from './pages/NewPost'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import StudentJobs from './pages/StudentJobs'
import NewJob from './pages/NewJob'
import { useEffect } from 'react'
import Materials from './pages/Materials'
import Housing from './pages/Housing'
import NewHousing from './pages/NewHousing'


import { initSocket, disconnectSocket } from './services/socket'
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  if (token) return <Navigate to="/dashboard" />
  return children
}

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" />
  return <Layout>{children}</Layout>
}

function App() {
  useEffect(() => {
    // Inicijalizuj socket ako je korisnik ulogovan
    const token = localStorage.getItem('token')
    if (token) {
      initSocket()
    }
  }, [])
  return (
    <BrowserRouter>
      <NotificationProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/shop" element={<PrivateRoute><Shop /></PrivateRoute>} />
          <Route path="/shop/new" element={<PrivateRoute><NewShopItem /></PrivateRoute>} />
          <Route path="/shop/:id" element={<PrivateRoute><ShopItemDetail /></PrivateRoute>} />
          <Route path="/companies" element={<PrivateRoute><Companies /></PrivateRoute>} />
          <Route path="/companies/:id" element={<PrivateRoute><CompanyDetail /></PrivateRoute>} />
          <Route path="/tutoring" element={<PrivateRoute><Tutoring /></PrivateRoute>} />
          <Route path="/tutoring/become-tutor" element={<PrivateRoute><BecomeTutor /></PrivateRoute>} />
          <Route path="/tutoring/my-bookings" element={<PrivateRoute><MyBookings /></PrivateRoute>} />
          <Route path="/tutoring/:id" element={<PrivateRoute><TutorDetail /></PrivateRoute>} />
          <Route path="/community" element={<PrivateRoute><Community /></PrivateRoute>} />
          <Route path="/community/new-post" element={<PrivateRoute><NewPost /></PrivateRoute>} />
          <Route path="/community/:id" element={<PrivateRoute><PostDetail /></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/chat/:userId" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/profile/:id" element={<PrivateRoute><Profile key={window.location.pathname} /></PrivateRoute>} />
          <Route path="/jobs" element={<PrivateRoute><StudentJobs /></PrivateRoute>} />
          <Route path="/jobs/new" element={<PrivateRoute><NewJob /></PrivateRoute>} />
          <Route path="/materials" element={<PrivateRoute><Materials /></PrivateRoute>} />
          <Route path="/housing" element={<PrivateRoute><Housing /></PrivateRoute>} />
          <Route path="/housing/new" element={<PrivateRoute><NewHousing /></PrivateRoute>} />
        </Routes>
      </NotificationProvider>
    </BrowserRouter>
  )
}

export default App