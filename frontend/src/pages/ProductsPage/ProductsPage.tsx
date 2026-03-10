import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ProductsPage.scss';
import ProductList from '../../components/ProductList';
import ProductModal from '../../components/ProductModal';
import AuthModal, { type AuthModalMode } from '../../components/AuthModal';
import { api, authStorage, type Product, type CreateProductDto } from '../../api';
import Footer from '../../components/Footer';

type ModalMode = 'create' | 'edit';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAuthed, setIsAuthed] = useState<boolean>(() => !!authStorage.getToken());
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
    loadProducts();
  }, []);

  useEffect(() => {
    const onStorage = () => setIsAuthed(!!authStorage.getToken());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const loadProducts = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      console.log(data);
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = (): void => {
    if (!authStorage.getToken()) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
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
            {isAuthed ? (
              <button
                className='btn'
                onClick={async () => {
                  await api.logout();
                  setIsAuthed(false);
                }}
              >
                Logout
              </button>
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
          {isAuthed ? (
            <button className='btn btn--primary btn--add' onClick={openCreate}>
              + Add Product
            </button>
          ) : null}
          <div className='toolbar'>
            <h1 className='title'>All Products</h1>
          </div>
          {loading ? (
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
        onSuccess={() => setIsAuthed(true)}
      />
    </div>
  );
}
