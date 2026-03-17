import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Product } from '../../api';
import './AdminProductsPage.scss';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.category.toLowerCase().includes(needle) ||
        p.id.toLowerCase().includes(needle),
    );
  }, [products, q]);

  return (
    <div className='adminProductsPage'>
      <div className='toolbar'>
        <h1 className='title'>Products</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className='input'
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Search by id/name/category...'
            style={{ width: 260 }}
          />
          <button className='btn' onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? <div className='empty'>Loading...</div> : null}

      {!loading ? (
        <div className='adminProductsTable'>
          <div className='adminProductsTable__head'>
            <div>Product</div>
            <div>Category</div>
            <div>Price</div>
            <div>Stock</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          {filtered.map((p) => (
            <div className='adminProductsTable__row' key={p.id}>
              <div className='adminProductsTable__product'>
                <img
                  src={p.photo}
                  alt={p.name}
                  className='adminProductsTable__thumb'
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/placeholder.svg';
                  }}
                />
                <div>
                  <div className='adminProductsTable__name'>{p.name}</div>
                  <div className='adminProductsTable__id'>{p.id}</div>
                </div>
              </div>
              <div>{p.category}</div>
              <div>${p.price}</div>
              <div>{p.stock}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className='btn' onClick={() => navigate(`/product/${p.id}`)}>
                  Open
                </button>
                <button
                  className='btn btn--danger'
                  onClick={async () => {
                    const ok = window.confirm(`Delete product "${p.name}"?`);
                    if (!ok) return;
                    await api.deleteProduct(p.id);
                    setProducts((prev) => prev.filter((x) => x.id !== p.id));
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {!filtered.length ? <div className='empty'>No products</div> : null}
        </div>
      ) : null}
    </div>
  );
}

