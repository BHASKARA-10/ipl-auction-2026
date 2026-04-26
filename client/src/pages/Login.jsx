import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, ChevronRight } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      // Login flow
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      if (users[email] && users[email].password === password) {
        localStorage.setItem('currentUser', JSON.stringify({ email, name: users[email].name }));
        navigate('/home');
      } else {
        alert("Invalid email or password");
      }
    } else {
      // Sign Up flow
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      if (users[email]) {
        alert("Email already exists! Please login.");
      } else {
        users[email] = { name, password };
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify({ email, name }));
        navigate('/home');
      }
    }
  };

  return (
    <div className="lobby-page" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="title-glow" style={{ fontSize: '4rem', marginBottom: '0' }}>IPL AUCTION 2026</div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>Please authenticate to access the auction portal.</p>
      
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '3rem', border: '2px solid var(--accent-gold)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--accent-gold)' }}>
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!isLogin && (
            <div className="form-group">
              <label><User size={14} style={{verticalAlign: 'middle'}}/> Full Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required={!isLogin} 
                placeholder="Enter your name"
              />
            </div>
          )}
          
          <div className="form-group">
            <label><Mail size={14} style={{verticalAlign: 'middle'}}/> Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label><Lock size={14} style={{verticalAlign: 'middle'}}/> Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="btn btn-gold" style={{ width: '100%', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            {isLogin ? "Login" : "Sign Up"} <ChevronRight size={20} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isLogin ? "Sign Up" : "Login"}
          </span>
        </div>
      </div>
    </div>
  );
}
