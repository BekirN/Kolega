import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { NotificationProvider } from './context/NotificationContext'
import Layout from './components/Layout'
import { lazy, Suspense, useEffect } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import { initSocket, disconnectSocket } from './services/socket'

const Home = lazy(() => import('./pages/Home'))
const Register = lazy(() => import('./pages/Register'))
const Login = lazy(() => import('./pages/Login'))
const Shop = lazy(() => import('./pages/Shop'))
const NewShopItem = lazy(() => import('./pages/NewShopItem'))
const ShopItemDetail = lazy(() => import('./pages/ShopItemDetail'))
const Companies = lazy(() => import('./pages/Companies'))
const CompanyDetail = lazy(() => import('./pages/CompanyDetail'))
const Tutoring = lazy(() => import('./pages/Tutoring'))
const TutorDetail = lazy(() => import('./pages/TutorDetail'))
const BecomeTutor = lazy(() => import('./pages/BecomeTutor'))
const MyBookings = lazy(() => import('./pages/MyBookings'))
const Community = lazy(() => import('./pages/Community'))
const PostDetail = lazy(() => import('./pages/PostDetail'))
const NewPost = lazy(() => import('./pages/NewPost'))
const Chat = lazy(() => import('./pages/Chat'))
const Profile = lazy(() => import('./pages/Profile'))
const StudentJobs = lazy(() => import('./pages/StudentJobs'))
const NewJob = lazy(() => import('./pages/NewJob'))
const Materials = lazy(() => import('./pages/Materials'))
const Housing = lazy(() => import('./pages/Housing'))
const NewHousing = lazy(() => import('./pages/NewHousing'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const Admin = lazy(() => import('./pages/Admin'))
const MyApplications = lazy(() => import('./pages/MyApplications'))
const CompanyApplications = lazy(() => import('./pages/CompanyApplications'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  if (token) return <Navigate to="/dashboard" />
  return children
}

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  if (!token) return <Navigate to="/login" />
  if (!user.emailVerified) return <Navigate to="/verify-email" />

  return <Layout>{children}</Layout>
}

function App() {
  useEffect(() => {
    // Inicijalizuj socket ako je korisnik ulogovan
    const token = localStorage.getItem('token')
    if (token) {
      initSocket()
    }
    return () => disconnectSocket()
  }, [])
  return (
    <BrowserRouter>
      <NotificationProvider>
        <ErrorBoundary>
          <Suspense fallback={<div role="status" className="p-8 text-center">Ucitavanje...</div>}>
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
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
          <Route path="/companies/my-applications" element={<PrivateRoute><MyApplications /></PrivateRoute>} />
          <Route path="/companies/:companyId/applications" element={<PrivateRoute><CompanyApplications /></PrivateRoute>} />
          <Route path="/companies/:id" element={<PrivateRoute><CompanyDetail /></PrivateRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
          </Suspense>
        </ErrorBoundary>
      </NotificationProvider>
    </BrowserRouter>
  )
}

export default App
