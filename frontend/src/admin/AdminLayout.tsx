import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './admin.scss';

export default function AdminLayout() {
  const auth = useAuth();
  const navigate = useNavigate();

  return (
    <div className='admin'>
      <aside className='admin__sidebar'>
        <div className='admin__brand'>Admin Panel</div>
        <div className='admin__nav'>
          <NavLink className='admin__link' to='/admin/users'>
            Users
          </NavLink>
          <NavLink className='admin__link' to='/admin/products'>
            Products
          </NavLink>
        </div>
        <div className='admin__sidebarFooter'>
          <div className='admin__me'>
            <div className='admin__meTitle'>Signed in as</div>
            <div className='admin__meValue'>{auth.user?.email}</div>
          </div>
          <div className='admin__sidebarActions'>
            <button className='btn' onClick={() => navigate('/')}>
              ← Store
            </button>
            <button className='btn btn--danger' onClick={() => auth.logout()}>
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className='admin__content'>
        <header className='admin__topbar'>
          <div className='admin__topbarTitle'>Clothes Store</div>
          <div className='admin__topbarRight'>
            <span className='admin__badge'>role: admin</span>
          </div>
        </header>
        <main className='admin__main'>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

