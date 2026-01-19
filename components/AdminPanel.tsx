
import React, { useState, useEffect } from 'react';
import { IconBot, IconTrash, IconClose, IconDocument } from './Icons';

interface UserRecord {
  username: string;
  email: string;
  loginTime: number;
  messageCount: number;
}

const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'logs'>('overview');

  useEffect(() => {
    const savedUsers = localStorage.getItem('assistant_db_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  }, []);

  const totalMessages = users.reduce((acc, u) => acc + u.messageCount, 0);

  return (
    <div className="absolute inset-0 z-[60] bg-slate-900/95 backdrop-blur-2xl flex flex-col animate-in fade-in duration-300">
      {/* Admin Header */}
      <header className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <IconBot className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">System Admin</h2>
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Neural Network Controller</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          {(['overview', 'users', 'logs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <button 
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          <IconClose className="w-8 h-8" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Total Neural Links', value: users.length, sub: 'Registered Identities', color: 'text-blue-400' },
                { label: 'Network Throughput', value: totalMessages, sub: 'Messages Exchanged', color: 'text-emerald-400' },
                { label: 'System Load', value: '14.2%', sub: 'Compute Efficiency', color: 'text-amber-400' },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl group hover:bg-white/10 transition-all">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{stat.label}</div>
                  <div className={`text-4xl font-black mb-1 ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-slate-400 font-medium">{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Compute Visualization */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Real-time Node Status</h3>
              <div className="space-y-6">
                {[
                  { name: 'Gemini-3-Pro Node', load: 65, status: 'Stable' },
                  { name: 'Veo Video Engine', load: 28, status: 'Idle' },
                  { name: 'Vision Processing', load: 82, status: 'High' },
                ].map((node, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                      <span className="text-slate-300">{node.name}</span>
                      <span className={node.load > 80 ? 'text-rose-400' : 'text-emerald-400'}>{node.status} ({node.load}%)</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${node.load > 80 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-emerald-500'}`} 
                        style={{ width: `${node.load}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="animate-in fade-in duration-500">
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">User Identity</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Neural Address</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Sync</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Interactions</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {users.map((u, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">{u.username}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">{u.email}</td>
                      <td className="px-6 py-4 text-xs font-medium">
                        {new Date(u.loginTime).toLocaleDateString()} {new Date(u.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-[10px] font-black rounded-lg uppercase tracking-widest">
                          {u.messageCount} Events
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-500 hover:text-rose-400 transition-colors">
                          <IconTrash className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-slate-500 italic">No users found in the neural database.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="bg-slate-950 p-6 rounded-3xl border border-white/10 font-mono text-sm leading-relaxed max-h-[60vh] overflow-y-auto">
              {[
                { time: '14:20:11', type: 'SYS', msg: 'Neural link established with user: admin' },
                { time: '14:19:45', type: 'API', msg: 'Gemini-3-Flash returned 200 OK' },
                { time: '14:18:02', type: 'SEC', msg: 'Encrypted tunnel verified for video stream' },
                { time: '14:15:30', type: 'SYS', msg: 'Garbage collection completed in 42ms' },
                { time: '14:12:12', type: 'USR', msg: 'User anonymous requested image generation' },
              ].map((log, i) => (
                <div key={i} className="flex gap-4 mb-2 hover:bg-white/5 p-1 rounded transition-colors group">
                  <span className="text-slate-600">[{log.time}]</span>
                  <span className={`font-bold ${log.type === 'SEC' ? 'text-emerald-500' : 'text-indigo-400'}`}>{log.type}</span>
                  <span className="text-slate-300 group-hover:text-white transition-colors">{log.msg}</span>
                </div>
              ))}
            </div>
            <button className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest px-4 py-2 hover:bg-white/5 rounded-xl transition-all">
              <IconDocument className="w-4 h-4" />
              Download Full Log Trace
            </button>
          </div>
        )}
      </main>

      <footer className="px-8 py-4 bg-white/5 border-t border-white/10 text-center">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
          Restricted Area • Authorized Personnel Only • Quantum Encryption Active
        </p>
      </footer>
    </div>
  );
};

export default AdminPanel;
