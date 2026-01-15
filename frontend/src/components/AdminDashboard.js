import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

function AdminDashboard({ onLogout }) {
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [stats, setStats] = useState({
    total_users: 0,
    total_stores: 0,
    total_ratings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [userSearch, setUserSearch] = useState('');
  const [storeSearch, setStoreSearch] = useState('');

  const [userSort, setUserSort] = useState('name');
  const [userOrder, setUserOrder] = useState('asc');

  const [storeSort, setStoreSort] = useState('name');
  const [storeOrder, setStoreOrder] = useState('asc');

  useEffect(() => {
    fetchData();
  }, [userSort, userOrder, storeSort, storeOrder, userSearch, storeSearch]);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const [usersRes, storesRes, statsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/users?sortBy=${userSort}&order=${userOrder}&search=${userSearch}`),
        fetch(`http://localhost:5000/api/stores?sortBy=${storeSort}&order=${storeOrder}&search=${storeSearch}`),
        fetch('http://localhost:5000/api/stats')
      ]);

      if (!usersRes.ok) throw new Error('Failed to fetch users');
      if (!storesRes.ok) throw new Error('Failed to fetch stores');
      if (!statsRes.ok) throw new Error('Failed to fetch stats');

      setUsers(await usersRes.json());
      setStores(await storesRes.json());
      setStats(await statsRes.json());

    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError('Failed to load data. Backend might be down.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    const name = prompt('Enter user name (5-60 chars):');
    if (!name) return;

    if (name.length < 5 || name.length > 60) {
      alert('Name must be 5-60 characters');
      return;
    }

    const email = prompt('Enter email:');
    if (!email) return;

    const address = prompt('Enter address:');
    if (!address) return;

    const role = prompt('Enter role (admin/user/store_owner):');
    if (!role) return;

    const password = prompt('Enter password (8-16 chars, uppercase + special):');
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,16}$/;

    if (!password || !passwordRegex.test(password)) {
      alert('Password must be 8-16 chars, 1 uppercase, 1 special character');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          address,
          role
        })
      });

      if (response.ok) {
        alert('✅ User added successfully!');
        fetchData(); 
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to add user");
    }
  };

  const handleAddStore = async () => {
    const name = prompt('Enter store name:');
    if (!name) return;
    const email = prompt('Enter store email:');
    if (!email) return;
    const address = prompt('Enter store address:');
    if (!address) return;
    const ownerId = prompt('Enter owner ID (from users table):');
    if (!ownerId) return;

    try {
      const response = await fetch('http://localhost:5000/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address,
          email,
          owner_id: parseInt(ownerId)
        })
      });

      if (response.ok) {
        alert('✅ Store added successfully!');
        fetchData(); 
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to add store");
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      alert("Delete functionality not fully implemented in backend yet.");
    }
  };

  const handleUpdatePassword = async () => {
    const currentPassword = prompt('Enter current password:');
    if (!currentPassword) return;

    const newPassword = prompt('Enter new password (8-16 chars, uppercase + special):');
    if (!newPassword) return;

    const confirmPassword = prompt('Confirm new password:');
    if (newPassword !== confirmPassword) {
      alert('❌ Passwords do not match!');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user'));

    if (user) {
      try {
        const response = await fetch("http://localhost:5000/api/auth/update-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            currentPassword,
            newPassword
          })
        });

        const data = await response.json();
        if (response.ok) {
          alert('✅ Password updated successfully!');
        } else {
          alert(`❌ Error: ${data.error}`);
        }
      } catch (error) {
        alert('Failed to update password');
      }
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1>🔧 Admin Dashboard</h1>
        </div>
        <div className="loading-container">
          <h2>📊 Loading data...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>🔧 Admin Dashboard</h1>
        <div className="header-actions">
          <button className="update-password-btn" onClick={handleUpdatePassword}>
            Update Password
          </button>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          ⚠️ {error} <button onClick={fetchData}>Retry</button>
        </div>
      )}

      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-number">{stats.total_users}</p>
        </div>
        <div className="stat-card">
          <h3>Total Stores</h3>
          <p className="stat-number">{stats.total_stores}</p>
        </div>
        <div className="stat-card">
          <h3>Total Ratings</h3>
          <p className="stat-number">{stats.total_ratings}</p>
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn-primary" onClick={handleAddUser}>
          Add New User
        </button>
        <button className="btn-secondary" onClick={handleAddStore}>
          Add New Store
        </button>
        <button className="btn-secondary" onClick={fetchData}>
          Refresh Data
        </button>
      </div>

      {/* Users Table */}
      <div className="table-section">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h3>Users List ({users.length})</h3>
            <input
              type="text"
              placeholder="🔍 Filter users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div className="sort-controls">
            Sort:
            <select value={userSort} onChange={e => setUserSort(e.target.value)}>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="role">Role</option>
            </select>
            <select value={userOrder} onChange={e => setUserOrder(e.target.value)}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Address</th>
                <th>Store Rating</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const ownedStore = stores.find(s => s.owner_id === user.id);
                return (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.address}</td>
                    <td>
                      {user.role === 'store_owner' && ownedStore
                        ? `⭐ ${ownedStore.average_rating || 0}/5`
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stores Table */}
      <div className="table-section">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h3>Stores List ({stores.length})</h3>
            <input
              type="text"
              placeholder="🔍 Filter stores..."
              value={storeSearch}
              onChange={(e) => setStoreSearch(e.target.value)}
              style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div className="sort-controls">
            Sort:
            <select value={storeSort} onChange={e => setStoreSort(e.target.value)}>
              <option value="name">Name</option>
              <option value="rating">Rating</option>
            </select>
            <select value={storeOrder} onChange={e => setStoreOrder(e.target.value)}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
        <div className="table-container">
          <table className="stores-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Address</th>
                <th>Avg Rating</th>
                <th>Total Ratings</th>
              </tr>
            </thead>
            <tbody>
              {stores.map(store => (
                <tr key={store.id}>
                  <td>{store.id}</td>
                  <td>{store.name}</td>
                  <td>{store.email}</td>
                  <td>{store.address}</td>
                  <td>{store.average_rating || 0}</td>
                  <td>{store.total_ratings || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-footer">
        <p>Using Backend API at Port 5000</p>
      </div>
    </div>
  );
}

export default AdminDashboard;