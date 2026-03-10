import React from 'react';
import ProductItem from './ProductItem';
import type { Product } from '../api';

interface ProductListProps {
  products: Product[];
}

const ProductList: React.FC<ProductListProps> = ({ products }) => {
  if (!products.length) {
    return <div className='empty'>No products yet</div>;
  }

  return (
    <div className='list'>
      {products.map((product) => (
        <ProductItem key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductList;
