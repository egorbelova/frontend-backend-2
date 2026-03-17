import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductPage.scss';
import { api, type Product } from '../../api';
import ProductModal from '../../components/ProductModal';
import Footer from '../../components/Footer';
import type { UpdateProductDto } from '../../api';
import { useAuth } from '../../auth/AuthContext';

export default function ProductPage() {
  const auth = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string>('');

  const [modalOpen, setModalOpen] = useState(false);

  const closeModal = () => {
    setModalOpen(false);
  };

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const handleSubmitModal = async (
    payload: Product | UpdateProductDto,
  ): Promise<void> => {
    try {
      if (!product) return;

      const { id, ...data } = payload as Product;
      const updated = await api.updateProduct(id, data);
      setProduct(updated);
      setSelectedImage(updated.photo);
      closeModal();
    } catch (err) {
      console.error('Error updating product:', err);
      alert('Error saving product');
    }
  };

  const loadProduct = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await api.getProductById(id!);
      setProduct(data);
      setSelectedImage(data.photo);
    } catch (err) {
      console.error('Error loading product:', err);
      navigate('/', { state: { openAuth: 'login' as const } });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!auth.user) {
      navigate('/', { state: { openAuth: 'login' as const } });
      return;
    }
    if (auth.user.role !== 'seller' && auth.user.role !== 'admin') {
      alert('Only seller/admin can edit products');
      return;
    }
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!auth.user) {
      navigate('/', { state: { openAuth: 'login' as const } });
      return;
    }
    if (auth.user.role !== 'admin') {
      alert('Only admin can delete products');
      return;
    }

    const ok = window.confirm('Delete this product?');
    if (!ok) return;

    try {
      await api.deleteProduct(product.id);
      navigate('/');
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className='product-page'>
        <div className='container'>
          <div className='loading'>Loading...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className='product-page'>
        <div className='container'>
          <div className='not-found'>Product not found</div>
          <button className='btn' onClick={handleBack}>
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='product-page'>
      <header className='header'>
        <div className='header__inner'>
          <div className='brand'>Clothes Store</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {!auth.user && (
              <>
                <button
                  className='btn'
                  onClick={() => navigate('/', { state: { openAuth: 'login' as const } })}
                >
                  Login
                </button>
                <button
                  className='btn'
                  onClick={() => navigate('/', { state: { openAuth: 'register' as const } })}
                >
                  Register
                </button>
              </>
            )}
            <button className='btn btn--back' onClick={handleBack}>
              ← Back to Products
            </button>
          </div>
        </div>
      </header>

      <main className='main'>
        <div className='container'>
          <div className='product-details'>
            <div className='product-gallery'>
              <div className='main-image'>
                <img
                  src={selectedImage}
                  alt={product.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      '/images/placeholder.svg';
                  }}
                />
              </div>
            </div>

            <div className='product-info'>
              <div className='product-header'>
                <h1 className='product-name'>{product.name}</h1>
                <div className='product-category'>{product.category}</div>
              </div>

              <div className='product-price'>
                <span className='current-price'>${product.price}</span>
              </div>

              <div className='product-stock'>
                {product.stock > 0 ? (
                  <span className='in-stock'>
                    In stock ({product.stock} available)
                  </span>
                ) : (
                  <span className='out-of-stock'>Out of stock</span>
                )}
              </div>

              <div className='product-description'>
                <h3>Description</h3>
                <p>{product.description}</p>
              </div>

              <div className='product-actions'>
                {auth.user ? (
                  <>
                    {(auth.user.role === 'seller' || auth.user.role === 'admin') && (
                      <button className='btn btn--primary' onClick={handleEdit}>
                        Edit Product
                      </button>
                    )}
                    {auth.user.role === 'admin' && (
                      <button className='btn btn--danger' onClick={handleDelete}>
                        Delete Product
                      </button>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ProductModal
        open={modalOpen}
        mode='edit'
        initialProduct={product}
        onClose={closeModal}
        onSubmit={handleSubmitModal}
      />
    </div>
  );
}
