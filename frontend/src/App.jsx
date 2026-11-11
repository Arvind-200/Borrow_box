import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import { AdminLayout } from './components/admin/AdminLayout'
import LandingPage from './pages/LandingPage'
import BrowsePage from './pages/BrowsePage'
import ProductDetailPage from './pages/ProductDetailPage'
import ProductFormPage from './pages/ProductFormPage'
import CategoriesPage from './pages/CategoriesPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import MyProductsPage from './pages/MyProductsPage'
import RequestsPage from './pages/RequestsPage'
import AboutPage from './pages/AboutPage'
import NotFoundPage from './pages/NotFoundPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminListingsPage from './pages/admin/AdminListingsPage'
import AdminRequestsPage from './pages/admin/AdminRequestsPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminReviewsPage from './pages/admin/AdminReviewsPage'
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage'
import AdminActivityPage from './pages/admin/AdminActivityPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#172033]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route
          path="/products/new"
          element={
            <ProtectedRoute>
              <ProductFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id/edit"
          element={
            <ProtectedRoute>
              <ProductFormPage />
            </ProtectedRoute>
          }
        />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/my-products"
          element={
            <ProtectedRoute>
              <MyProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests"
          element={
            <ProtectedRoute>
              <RequestsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="listings" element={<AdminListingsPage />} />
        <Route path="requests" element={<AdminRequestsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="activity" element={<AdminActivityPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  )
}

export default App
