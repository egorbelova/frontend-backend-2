import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Role, type User } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import './UsersPage.scss';

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/', { state: { openAuth: 'login' as const } });
      return;
    }
    if (user.role !== 'admin') {
      navigate('/');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  const updateUser = async (id: string, patch: Partial<User>) => {
    const updated = await api.updateUser(id, patch);
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
  };

  const blockUser = async (id: string) => {
    const updated = await api.blockUser(id);
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
  };

  if (authLoading || loading) {
    return (
      <div className='usersPage'>
        <div className='container'>
          <div className='loading'>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className='usersPage'>
      <div className='toolbar'>
        <h1 className='title'>Users</h1>
        <button className='btn' onClick={load}>
          Refresh
        </button>
      </div>

      <div className='usersTable'>
        <div className='usersTable__head'>
          <div>Email</div>
          <div>Name</div>
          <div>Role</div>
          <div>Status</div>
          <div style={{ textAlign: 'right' }}>Actions</div>
        </div>

        {users.map((u) => (
          <div className='usersTable__row' key={u.id}>
            <div className='mono'>{u.email}</div>
            <div>
              {u.first_name} {u.last_name}
            </div>
            <div>
              <select
                value={u.role}
                onChange={async (e) => {
                  const role = e.target.value as Role;
                  await updateUser(u.id, { role });
                }}
                disabled={u.blocked}
              >
                <option value='user'>user</option>
                <option value='seller'>seller</option>
                <option value='admin'>admin</option>
              </select>
            </div>
            <div>{u.blocked ? 'blocked' : 'active'}</div>
            <div
              style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}
            >
              <button
                className='btn'
                onClick={async () => {
                  const first_name = window.prompt('First name', u.first_name);
                  if (first_name === null) return;
                  const last_name = window.prompt('Last name', u.last_name);
                  if (last_name === null) return;
                  await updateUser(u.id, { first_name, last_name });
                }}
                disabled={u.blocked}
              >
                Edit
              </button>
              {u.id !== user?.id ? (
                u.blocked ? (
                  <button
                    className='btn'
                    onClick={async () => {
                      await updateUser(u.id, { blocked: false });
                    }}
                  >
                    Unblock
                  </button>
                ) : (
                  <button
                    className='btn btn--danger'
                    onClick={async () => {
                      const ok = window.confirm(`Block user ${u.email}?`);
                      if (!ok) return;
                      await blockUser(u.id);
                    }}
                  >
                    Block
                  </button>
                )
              ) : null}
            </div>
          </div>
        ))}

        {!users.length ? <div className='empty'>No users</div> : null}
      </div>
    </div>
  );
}
