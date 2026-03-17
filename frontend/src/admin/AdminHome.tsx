import { useEffect, useState } from 'react';
import { api, type Product, type User } from '../api';
import './admin.scss';

export default function AdminHome() {
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [productsCount, setProductsCount] = useState<number | null>(null);

  useEffect(() => {
    const run = async () => {
      const [users, products] = await Promise.all<[User[], Product[]]>([
        api.getUsers(),
        api.getProducts(),
      ]);
      setUsersCount(users.length);
      setProductsCount(products.length);
    };
    run().catch(() => {
      setUsersCount(null);
      setProductsCount(null);
    });
  }, []);

  return (
    <div className='adminPage'>
      <div className='adminPage__titleRow'>
        <h1 className='adminPage__title'>Dashboard</h1>
      </div>

      <div className='adminCards'>
        <div className='adminCard'>
          <div className='adminCard__label'>Users</div>
          <div className='adminCard__value'>
            {usersCount == null ? '—' : usersCount}
          </div>
        </div>
        <div className='adminCard'>
          <div className='adminCard__label'>Products</div>
          <div className='adminCard__value'>
            {productsCount == null ? '—' : productsCount}
          </div>
        </div>
      </div>
    </div>
  );
}

