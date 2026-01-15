import React, { useState, useEffect } from 'react';
import './OwnerDashboard.css';

const OwnerDashboard = ({ onLogout }) => {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (user?.id) {
      fetchOwnerData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedStoreId) {
    }
  }, [selectedStoreId]);

  const fetchOwnerData = async () => {
    setLoading(true);
    try {
      const storesRes = await fetch("http://localhost:5000/api/stores");
      const storesData = await storesRes.json();
      const myStores = storesData.filter(s => s.owner_id === user.id);

      if (myStores.length > 0) {
        setStores(myStores);
        setSelectedStoreId(myStores[0].id); 
      }
      const ratingsRes = await fetch(`http://localhost:5000/api/store-owner/${user.id}/ratings`);
      if (ratingsRes.ok) {
        const ratingsData = await ratingsRes.json();
        setRatings(ratingsData);
      }

    } catch (err) {
      console.error("Error fetching owner data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
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

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,16}$/;
    if (!passwordRegex.test(newPassword)) {
      alert('❌ Password must be 8-16 chars, 1 uppercase, 1 special character');
      return;
    }

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
  };

  const handleReply = (email, customerName, storeName) => {
    if (!email) {
      alert("No email available for this customer.");
      return;
    }
    const subject = `Regarding your review for ${storeName}`;
    const body = `Hi ${customerName},\n\nThank you for your feedback...`;
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleThank = (email, customerName, storeName) => {
    if (!email) {
      alert("No email available for this customer.");
      return;
    }
    const subject = `Thank you for visiting ${storeName}!`;
    const body = `Hi ${customerName},\n\nWe really appreciate your positive feedback!`;
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleExportCSV = () => {
    if (ratings.length === 0) return alert("No ratings to export.");

    let csvContent = "data:text/csv;charset=utf-8,Date,User Name,User Email,Store,Rating,Comment\n";

    ratings.forEach(row => {
      const date = new Date(row.created_at).toLocaleDateString();

      const cleanName = (row.user_name || "Anonymous").replace(/"/g, '""');
      const cleanComment = (row.comment || "").replace(/"/g, '""');
      const cleanStore = (row.store_name || "").replace(/"/g, '""');

      csvContent += `"${date}","${cleanName}","${row.user_email}","${cleanStore}",${row.rating},"${cleanComment}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "store_ratings.csv");
    document.body.appendChild(link); 
    link.click();
    document.body.removeChild(link);
  };


  const currentStore = stores.find(s => s.id === parseInt(selectedStoreId));

  const displayRatings = ratings.filter(r => {
    if (selectedStoreId && r.store_id !== parseInt(selectedStoreId)) return false;
    if (filter === 'all') return true;
    if (filter === 'positive') return r.rating >= 4;
    if (filter === 'negative') return r.rating <= 2;
    if (filter === 'neutral') return r.rating === 3;
    return true;
  });

  const StarDisplay = ({ rating }) => {
    return (
      <div className="star-display">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className={`star ${star <= rating ? 'filled' : ''}`}>
            ★
          </span>
        ))}
        <span className="rating-value">({rating}/5)</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="owner-dashboard">
        <div className="dashboard-header"><h1>🏪 Store Owner Dashboard</h1></div>
        <div className="loading">Loading store data...</div>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="owner-dashboard">
        <div className="dashboard-header">
          <h1>🏪 Store Owner Dashboard</h1>
          <div className="header-actions">
            <button className="logout-btn" onClick={onLogout}>🚪 Logout</button>
          </div>
        </div>
        <div className="empty-state">
          <h2>No Store Found</h2>
          <p>You are registered as a Store Owner, but no store is linked to your account.</p>
          <p>Please contact an Administrator to assign a store to your ID: {user.id}</p>
        </div>
      </div>
    );
  }

  const storeRatings = ratings.filter(r => r.store_id === parseInt(selectedStoreId));
  const positiveCount = storeRatings.filter(r => r.rating >= 4).length;

  return (
    <div className="owner-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>🏪 Store Owner Dashboard</h1>
        <div className="header-actions">
          <button className="update-password-btn" onClick={handleUpdatePassword}>
            🔑 Update Password
          </button>
          <button className="logout-btn" onClick={onLogout}>🚪 Logout</button>
        </div>
      </div>

      {/* Store Selector (if multiple) */}
      {stores.length > 1 && (
        <div className="store-selector" style={{ padding: '0 20px', marginBottom: '20px' }}>
          <label><strong>Select Store: </strong></label>
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            style={{ padding: '8px', fontSize: '16px' }}
          >
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name} (ID: {s.id})</option>
            ))}
          </select>
        </div>
      )}

      {/* Store Overview */}
      {currentStore && (
        <div className="store-overview">
          <div className="store-card">
            <h2>📋 Store Information</h2>
            <div className="store-details">
              <div className="detail-item">
                <span className="detail-label">Store Name:</span>
                <span className="detail-value">{currentStore.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Address:</span>
                <span className="detail-value">{currentStore.address}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{currentStore.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Owner ID:</span>
                <span className="detail-value">{currentStore.owner_id}</span>
              </div>

              <div className="store-actions" style={{ marginTop: '15px' }}>
                <button className="edit-btn" style={{ marginRight: '10px' }} onClick={async () => {
                  if (!selectedStoreId) return alert("Select a store first");
                  const name = prompt("Update Store Name:", currentStore.name);
                  if (!name) return;
                  const address = prompt("Update Address:", currentStore.address);
                  if (!address) return;
                  const email = prompt("Update Email:", currentStore.email);
                  if (!email) return;

                  try {
                    const response = await fetch(`http://localhost:5000/api/stores/${selectedStoreId}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name, address, email })
                    });
                    if (response.ok) {
                      alert("✅ Store updated successfully!");
                      fetchOwnerData();
                    } else {
                      alert("❌ Failed to update store");
                    }
                  } catch (err) {
                    alert("Error updating store");
                  }
                }}>
                  ✏️ Edit Store Info
                </button>

                <button className="action-btn" onClick={() => {
                  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                  ratings.forEach(r => distribution[r.rating] = (distribution[r.rating] || 0) + 1);
                  alert(`📊 Rating Distribution:\n⭐⭐⭐⭐⭐: ${distribution[5]}\n⭐⭐⭐⭐: ${distribution[4]}\n⭐⭐⭐: ${distribution[3]}\n⭐⭐: ${distribution[2]}\n⭐: ${distribution[1]}`);
                }}>
                  📊 View Analytics
                </button>

                <button className="action-btn" onClick={() => {
                  alert(`📝 Response Templates:\n1. "Thank you for your feedback!"\n2. "We apologize for the inconvenience."\n3. "Thanks for visiting!"`);
                }}>
                  💬 Response Templates
                </button>
              </div>
            </div>
          </div>

          {/* Store Stats */}
          <div className="stats-card">
            <h2>📊 Store Performance</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">⭐</div>
                <div className="stat-info">
                  <h3>Average Rating</h3>
                  <p className="stat-value">{currentStore.average_rating}/5</p>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">📈</div>
                <div className="stat-info">
                  <h3>Total Ratings</h3>
                  <p className="stat-value">{currentStore.total_ratings}</p>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">👍</div>
                <div className="stat-info">
                  <h3>Positive Reviews</h3>
                  <p className="stat-value">
                    {positiveCount}
                  </p>
                </div>
              </div>

              <div className="stat-item">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                  <h3>Total Feedback</h3>
                  <p className="stat-value">{storeRatings.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ratings Section */}
      <div className="ratings-section">
        <div className="section-header">
          <h2>⭐ Customer Ratings for {currentStore?.name}</h2>
          <div className="filters" style={{ display: 'flex', gap: '10px' }}>
            <button className="export-btn" onClick={handleExportCSV} style={{ padding: '8px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              📂 Export to CSV
            </button>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Ratings</option>
              <option value="positive">Positive (4-5 stars)</option>
              <option value="neutral">Neutral (3 stars)</option>
              <option value="negative">Negative (1-2 stars)</option>
            </select>
          </div>
        </div>

        <div className="ratings-list">
          {displayRatings.length > 0 ? displayRatings.map(rating => (
            <div key={rating.id} className="rating-card">
              <div className="rating-header">
                <div className="user-info">
                  <span className="user-name">{rating.user_name || 'Anonymous'}</span>
                  <span className="user-email">{rating.user_email}</span>
                </div>
                <div className="rating-meta">
                  <StarDisplay rating={rating.rating} />
                  <span className="rating-date">{new Date(rating.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="rating-message" style={{ margin: '10px 0', fontStyle: 'italic', color: '#555' }}>
                "{rating.comment || "No comment provided."}"
              </div>

              <div className="rating-actions">
                <button
                  className="reply-btn"
                  onClick={() => handleReply(rating.user_email, rating.user_name, currentStore.name)}
                >
                  ✉️ Reply
                </button>
                <button
                  className="thank-btn"
                  onClick={() => handleThank(rating.user_email, rating.user_name, currentStore.name)}
                >
                  🙌 Thank Customer
                </button>
              </div>
            </div>
          )) : (
            <div className="empty-state">
              <p>📭 No ratings found for the selected filter</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="dashboard-footer">
        <p>Using Backend API at Port 5000</p>
        <button className="logout-btn-bottom" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default OwnerDashboard;