import type { Product } from '../api';
import { useNavigate } from 'react-router-dom';

interface ProductItemProps {
  product: Product;
}

export default function ProductItem({ product }: ProductItemProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  if (!product || typeof product !== 'object') {
    console.error('Invalid product data:', product);
    return <div className='productRow error'>Invalid product data</div>;
  }

  const safeProduct = {
    id: product.id || 'unknown',
    name: product.name || 'Unnamed Product',
    category: product.category || 'Uncategorized',
    description: product.description || 'No description',
    price: product.price ?? 0,
    stock: product.stock ?? 0,
    photo: product.photo,
  };

  return (
    <div className='productRow' onClick={handleCardClick}>
      <div className='productImage'>
        <img
          draggable={false}
          src={safeProduct.photo}
          alt={safeProduct.name}
          // для fallback`а на placeholder добавил object-fit чтобы svg уместился
          className={
            safeProduct.photo.endsWith('placeholder.svg') ? 'placeholder' : ''
          }
        />
      </div>
      <div className='productInfo'>
        <div className='productMain'>
          <div className='productName'>{safeProduct.name}</div>
          <div className='productCategory'>{safeProduct.category}</div>
        </div>

        <div className='productDetails'>
          <div className='productPrice'>${safeProduct.price}</div>
        </div>
      </div>
    </div>
  );
}
