import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BusinessDetail from './pages/BusinessDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import EnterpriseDashboard from './pages/EnterpriseDashboard';
import AddEditBusiness from './pages/AddEditBusiness';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/business/:id" element={<BusinessDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Admin routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Enterprise routes */}
              <Route
                path="/enterprise"
                element={
                  <ProtectedRoute roles={['enterprise', 'admin']}>
                    <EnterpriseDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/enterprise/add-business"
                element={
                  <ProtectedRoute roles={['enterprise', 'admin']}>
                    <AddEditBusiness />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/enterprise/edit-business/:id"
                element={
                  <ProtectedRoute roles={['enterprise', 'admin']}>
                    <AddEditBusiness />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
