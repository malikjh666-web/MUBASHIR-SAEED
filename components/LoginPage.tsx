
import React, { useState, useEffect } from 'react';
import { IconBot } from './Icons';

interface LoginPageProps {
  onLogin: (userData: { username: string; email: string }) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email regex for robust validation
  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const syncUserToDatabase = (userData: { username: string; email: string }) => {
    try {
      const savedUsers = localStorage.getItem('assistant_db_users');
      let users = savedUsers ? JSON.parse(savedUsers) : [];
      
      const cleanUsername = userData.username.trim();
      const cleanEmail = userData.email.trim().toLowerCase();

      // Update existing user or add new one
      const existingIdx = users.findIndex((u: any) => u.username.toLowerCase() === cleanUsername.toLowerCase());
      
      if (existingIdx >= 0) {
        users[existingIdx] = { 
          ...users[existingIdx], 
          email: cleanEmail, 
          loginTime: Date.now() 
        };
      } else {
        users.push({ 
          username: cleanUsername, 
          email: cleanEmail, 
          loginTime: Date.now(), 
          messageCount: Math.floor(Math.random() * 50) + 1
        });
      }
      
      localStorage.setItem('assistant_db_users', JSON.stringify(users));
    } catch (e) {
      console.error("Database Sync Error:", e);
      // We don't block the user from logging in if storage fails, 
      // but we log it for debugging.
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Debugging: Check for empty fields
    if (!username.trim()) {
      setError("Please provide a valid User Identity.");
      return;
    }

    // Fix: Validate "Gmail slot" / Email format
    if (!validateEmail(email)) {
      setError("Please enter a valid neural address (e.g., user@gmail.com).");
      return;
    }

    if (password.length < 4) {
      setError("Security Key must be at least 4 characters.");
      return;
    }
    
    setIsLoading(true);
    
    // Simulate link establishment
    setTimeout(() => {
      const userData = { 
        username: username.trim(), 
        email: email.trim().toLowerCase() 
      };
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
          <p className="text-slate-500 text-sm font-medium mt-2 text-center">Establish your session link</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-in slide-in-from-top-2 duration-300">
            <p className="text-xs font-bold text-rose-600 flex items-center gap-2">
              <span className="text-lg">⚠️</span> {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">User Identity</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className={`w-full bg-slate-50/50 border rounded-2xl px-6 py-4 focus:ring-4 transition-all placeholder:text-slate-300 font-medium focus:outline-none ${
                username ? 'border-indigo-100 focus:ring-indigo-500/10' : 'border-slate-100 focus:ring-blue-500/10'
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Neural Address (Gmail Slot)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error?.includes("address")) setError(null);
              }}
              placeholder="e.g., mubashir@gmail.com"
              className={`w-full bg-slate-50/50 border rounded-2xl px-6 py-4 focus:ring-4 transition-all placeholder:text-slate-300 font-medium focus:outline-none ${
                error?.includes("address") 
                ? 'border-rose-300 focus:ring-rose-500/10' 
                : email && validateEmail(email)
                ? 'border-emerald-200 focus:ring-emerald-500/10'
                : 'border-slate-100 focus:ring-blue-500/10'
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Security Key</label>
            <input
              type="password"
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
                <span>Syncing Neural Link...</span>
              </>
            ) : (
              'Establish Connection'
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          <p>Restricted Area • Use "admin" for dashboard</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
