import { Routes, Route } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { ProtectedRoute } from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import BrowsePage from './pages/BrowsePage'
import CategoriesPage from './pages/CategoriesPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import MyProductsPage from './pages/MyProductsPage'
import AboutPage from './pages/AboutPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#172033]">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/my-products" element={<ProtectedRoute><MyProductsPage /></ProtectedRoute>} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App