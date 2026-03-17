import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProductsPage from './pages/ProductsPage/ProductsPage';
import ProductPage from './pages/ProductPage/ProductPage';
import { AuthProvider } from './auth/AuthContext';
import UsersPage from './pages/UsersPage/UsersPage';
import { RequireAdmin } from './admin/RequireAdmin';
import AdminLayout from './admin/AdminLayout';
import AdminProductsPage from './pages/AdminProductsPage/AdminProductsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<ProductsPage />} />
          <Route path='/product/:id' element={<ProductPage />} />
          <Route
            path='/admin'
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<Navigate to='users' replace />} />
            <Route path='users' element={<UsersPage />} />
            <Route path='products' element={<AdminProductsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
