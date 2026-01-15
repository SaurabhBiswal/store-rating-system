import React, { useState, useEffect } from 'react';

const UserDashboard = ({ onLogout }) => {
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState('');
  const [userRatings, setUserRatings] = useState({});
  const [commentInputs, setCommentInputs] = useState({}); 
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);


  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchStores();
    if (user?.id) {
      fetchUserRatings();
    }
    
  }, [sortBy, sortOrder]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const userId = user?.id || -1;
      const response = await fetch(`http://localhost:5000/api/stores?sortBy=${sortBy}&order=${sortOrder}&userId=${userId}`);
      const data = await response.json();
      setStores(data);
    } catch (error) {
      console.error("Error fetching stores:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRatings = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/user-ratings/${user.id}`);
      const data = await response.json();
      const ratingsMap = {};
      const commentsMap = {};
      data.forEach(r => {
        ratingsMap[r.store_id] = r.rating;
        if (r.comment) commentsMap[r.store_id] = r.comment;
      });
      setUserRatings(ratingsMap);
      setCommentInputs(commentsMap);
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };

  const handleRateStore = async (storeId) => {
    if (!user) return;
    const rating = userRatings[storeId];
    const comment = commentInputs[storeId] || "";

    if (!rating) return alert("Please select a star rating first.");

    try {
      const response = await fetch("http://localhost:5000/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          store_id: storeId,
          rating: rating,
          comment: comment
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }
      alert("✅ Review submitted!");
      fetchStores();
    } catch (error) {
      console.error("Rating error:", error);
      alert("Failed to submit rating");
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
      console.error("Password update error:", error);
      alert("Failed to update password");
    }
  };

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(search.toLowerCase()) ||
    store.address.toLowerCase().includes(search.toLowerCase())
  );

  const StarRating = ({ rating, editable, onRate }) => {
    const [hoverRating, setHoverRating] = useState(0);

    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            disabled={!editable}
            className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
            onClick={() => editable && onRate(star)}
            onMouseEnter={() => editable && setHoverRating(star)}
            onMouseLeave={() => editable && setHoverRating(0)}
            style={{
              cursor: editable ? 'pointer' : 'default',
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: star <= (hoverRating || rating) ? '#ffd700' : '#ccc'
            }}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard user-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>👤 User Dashboard - {user?.name}</h1>
        <div className="header-actions">
          <button className="action-btn" onClick={handleUpdatePassword}>
            🔑 Update Password
          </button>
          <button className="logout-btn" onClick={onLogout}>🚪 Logout</button>
        </div>
      </div>

      {/* Control Bar: Search & Sort */}
      <div className="search-section" style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
        <div className="search-box" style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="🔍 Search stores by name or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px', fontSize: '1rem' }}
          />
        </div>

        <div className="sort-box">
          <label style={{ marginRight: '10px' }}>Sort By:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '10px' }}>
            <option value="name">Name</option>
            <option value="rating">Rating</option>
          </select>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ padding: '10px', marginLeft: '5px' }}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      {/* Stores Grid */}
      {loading ? <p>Loading stores...</p> : (
        <div className="stores-grid">
          {filteredStores.map(store => (
            <div key={store.id} className="store-card" style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '15px', background: 'white' }}>
              <div className="store-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h3>{store.name}</h3>
                <span className="store-id" style={{ color: '#888' }}>ID: {store.id}</span>
              </div>

              <p className="store-address">📍 {store.address}</p>

              <div className="store-rating" style={{ marginTop: '10px' }}>
                <div className="overall-rating">
                  <span className="rating-label">Overall Rating: </span>
                  <span className="rating-value" style={{ fontWeight: 'bold' }}>{store.average_rating}/5</span>
                  <span className="rating-count" style={{ marginLeft: '5px', color: '#666' }}>({store.total_ratings} ratings)</span>
                </div>

                <div className="user-rating" style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                  <span className="rating-label">Your Review: </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '5px' }}>
                    {/* Star Rating Input */}
                    <StarRating
                      rating={userRatings[store.id] || store.my_rating || 0}
                      editable={true}
                      onRate={(r) => setUserRatings({ ...userRatings, [store.id]: r })}
                    />

                    {/* Visible Comment Box */}
                    <textarea
                      placeholder="Write your review here..."
                      value={commentInputs[store.id] || ""}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [store.id]: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        minHeight: '60px',
                        fontFamily: 'inherit'
                      }}
                    />

                    {/* Submit Button */}
                    <button
                      onClick={() => handleRateStore(store.id)}
                      style={{
                        alignSelf: 'flex-start',
                        padding: '6px 12px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Submit Review
                    </button>

                    {store.my_rating > 0 && (
                      <span style={{ fontSize: '0.9em', color: '#666' }}>
                        (You rated this {store.my_rating} stars)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredStores.length === 0 && (
        <div className="empty-state">
          <p>🔍 No stores found matching your search</p>
          <button onClick={() => setSearch('')}>Clear Search</button>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;