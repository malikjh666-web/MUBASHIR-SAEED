
import React, { useState } from 'react';
import { IconBot } from './Icons';

interface LoginPageProps {
  onLogin: (userData: { username: string; email: string }) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const syncUserToDatabase = (userData: { username: string; email: string }) => {
    const savedUsers = localStorage.getItem('assistant_db_users');
    let users = savedUsers ? JSON.parse(savedUsers) : [];
    
    // Update existing user or add new one
    const existingIdx = users.findIndex((u: any) => u.username === userData.username);
    if (existingIdx >= 0) {
      users[existingIdx] = { ...users[existingIdx], email: userData.email, loginTime: Date.now() };
    } else {
      users.push({ 
        username: userData.username, 
        email: userData.email, 
        loginTime: Date.now(), 
        messageCount: Math.floor(Math.random() * 50) + 1 // Initial mock stats
      });
    }
    
    localStorage.setItem('assistant_db_users', JSON.stringify(users));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) return;
    
    setIsLoading(true);
    // Simulate a brief neural link establishment
    setTimeout(() => {
      const userData = { username, email };
      syncUserToDatabase(userData);
      onLogin(userData);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md glass rounded-[3rem] shadow-2xl overflow-hidden border border-white/40 p-10 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-6 animate-float">
            <IconBot className="w-14 h-14" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight text-center">Neural Hub</h1>
          <p className="text-slate-500 text-sm font-medium mt-2 text-center">Connect to your personal AI Assistant</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">User Identity</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all placeholder:text-slate-300 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Neural Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all placeholder:text-slate-300 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Security Key</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all placeholder:text-slate-300 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 mt-6 rounded-2xl font-bold text-white transition-all shadow-xl flex items-center justify-center gap-3 ${
              isLoading 
              ? 'bg-slate-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] shadow-blue-500/25'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Establishing Link...</span>
              </>
            ) : (
              'Enter Hub'
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 text-center text-xs text-slate-400">
          <p>Hint: Use username "admin" for system dashboard access.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
