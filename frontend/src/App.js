import React, { useState, useEffect } from "react";
import "./App.css";
import AdminDashboard from './components/AdminDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import UserDashboard from './components/UserDashboard';
function LoginForm({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    address: "",
    role: "user"
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!isLogin) {
      if (formData.name.length < 5 || formData.name.length > 60) {
        newErrors.name = "Name must be 5-60 characters";
      }
      if (formData.address.length > 400) {
        newErrors.address = "Address too long (max 400 chars)";
      }
    }

    if (!formData.email.includes("@")) {
      newErrors.email = "Valid email required";
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,16}$/;
    if (!passwordRegex.test(formData.password)) {
      newErrors.password = "8-16 chars, 1 uppercase, 1 special character";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Please fix form errors");
      return;
    }

    try {
      const endpoint = isLogin ? "login" : "register";
      const response = await fetch(`http://localhost:5000/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("lastLogin", new Date().toISOString());
        onLogin(data.user);
        alert(`✅ ${isLogin ? "Login" : "Registration"} Successful!`);
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error("API Error:", error);
      alert("Failed to connect to server. Please check if backend is running.");
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🏪 Store Rating Platform</h1>
        <p>Full-Stack Intern Coding Challenge</p>
      </header>

      <div className="main-content">
        <div className="auth-section">
          <div className="auth-card">
            <h2>{isLogin ? "🔐 Login" : "📝 Register"}</h2>

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <>
                  <div className="form-group">
                    <label>Full Name (5-60 chars)</label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      minLength={5}
                      maxLength={60}
                    />
                    {errors.name && <span className="error">{errors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label>Address (max 400 chars)</label>
                    <input
                      type="text"
                      placeholder="Enter address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      maxLength={400}
                    />
                    {errors.address && <span className="error">{errors.address}</span>}
                  </div>

                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="user">Normal User</option>
                      <option value="admin">System Administrator</option>
                      <option value="store_owner">Store Owner</option>
                    </select>
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                {errors.email && <span className="error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label>Password (8-16 chars, uppercase + special)</label>
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  minLength={8}
                  maxLength={16}
                  required
                />
                {errors.password && <span className="error">{errors.password}</span>}
              </div>

              <button type="submit" className="submit-btn">
                {isLogin ? "Login" : "Register"}
              </button>
            </form>

            <p className="toggle-text">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="toggle-btn"
              >
                {isLogin ? "Register" : "Login"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };
  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }
  switch (user.role) {
    case "admin":
      return <AdminDashboard onLogout={handleLogout} />;
    case "store_owner":
      return <OwnerDashboard onLogout={handleLogout} />;
    default:
      return <UserDashboard onLogout={handleLogout} />;
  }
}

export default App;