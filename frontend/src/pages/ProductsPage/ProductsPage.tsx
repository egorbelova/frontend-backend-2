import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ProductsPage.scss';
import ProductList from '../../components/ProductList';
import ProductModal from '../../components/ProductModal';
import AuthModal, { type AuthModalMode } from '../../components/AuthModal';
import { api, type Product, type CreateProductDto } from '../../api';
import Footer from '../../components/Footer';
import { useAuth } from '../../auth/AuthContext';

type ModalMode = 'create' | 'edit';

export default function ProductsPage() {
  const auth = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const state = location.state as { openAuth?: AuthModalMode } | null;
    if (state?.openAuth) {
      setAuthModalMode(state.openAuth);
      setAuthModalOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      setLoading(false);
      return;
    }
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.loading, auth.user?.id]);

  const loadProducts = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
      setAuthModalMode('login');
      setAuthModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = (): void => {
    if (!auth.user) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }
    if (auth.user.role !== 'seller' && auth.user.role !== 'admin') {
      alert('Only seller/admin can create products');
      return;
    }
    setModalMode('create');
    setEditingProduct(null);
    setModalOpen(true);
  };

  const closeModal = (): void => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmitModal = (productData: Product | CreateProductDto): void => {
    const submitAsync = async () => {
      try {
        if (modalMode === 'create') {
          const newProduct = await api.createProduct(
            productData as CreateProductDto,
          );
          setProducts((prev) => [...prev, newProduct]);
        } else {
          const { id, ...data } = productData as Product;
          const updated = await api.updateProduct(id, data);
          setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
        }
        closeModal();
      } catch (err) {
        console.error(err);
      }
    };

    submitAsync();
  };

  return (
    <div className='page'>
      <header className='header'>
        <div className='brand'>Clothes Store</div>
        <div className='header__inner'>
          <div className='header__right'>
            {auth.user ? (
              <>
                {auth.user.role === 'admin' ? (
                  <button className='btn' onClick={() => navigate('/admin')}>
                    Admin
                  </button>
                ) : null}
                <button className='btn' onClick={() => auth.logout()}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  className='btn'
                  onClick={() => {
                    setAuthModalMode('login');
                    setAuthModalOpen(true);
                  }}
                >
                  Login
                </button>
                <button
                  className='btn'
                  onClick={() => {
                    setAuthModalMode('register');
                    setAuthModalOpen(true);
                  }}
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className='main'>
        <div className='container'>
          {auth.user && (auth.user.role === 'seller' || auth.user.role === 'admin') ? (
            <button className='btn btn--primary btn--add' onClick={openCreate}>
              + Add Product
            </button>
          ) : null}
          <div className='toolbar'>
            <h1 className='title'>All Products</h1>
          </div>
          {auth.loading || loading ? (
            <div className='empty'>Loading...</div>
          ) : (
            <ProductList products={products} />
          )}
        </div>
      </main>
      <Footer />
      <ProductModal
        open={modalOpen}
        mode={modalMode}
        initialProduct={editingProduct}
        onClose={closeModal}
        onSubmit={handleSubmitModal}
      />
      <AuthModal
        open={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={async () => {
          await auth.refreshMe();
          await loadProducts();
        }}
      />
    </div>
  );
}
