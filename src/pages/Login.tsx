import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Coffee, AlertTriangle, Lock, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [nomUtilisateur, setNomUtilisateur] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); 
    
    setError(null);
    setLoading(true);

    try {
      const baseURL = api.defaults.baseURL || '';
      const loginURL = `${baseURL}/auth/login`;
      const response = await fetch(loginURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nomUtilisateur, motDePasse }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Identifiants incorrects ou serveur utile.");
      }
      if (data.user?.role === 'SERVEUR') {
        throw new Error("Accès refusé. Cette plateforme est réservée à l'administration.");
      }
      auth?.login(data.access_token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Login Error Captured safely:", err);
      setError(err.message || "Identifiants incorrects ou serveur injoignable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#110A06] font-sans p-4">
      <div className="w-full max-w-md rounded-xl bg-[#1C120C] p-8 shadow-2xl border border-[#2D1F16] space-y-6">
        <div className="text-center border-b border-[#2D1F16] pb-5">
          <Coffee className="w-10 h-10 text-[#B07A50] mx-auto mb-2" />
          <h1 className="text-3xl font-serif font-black tracking-tight text-[#EAD7C3]">
            Café <span className="text-[#B07A50]">Mistral</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 mt-2 bg-[#2D1F16] inline-block px-3 py-1 rounded-md border border-[#3E2723]">
            Espace Direction & Gestion
          </p>
        </div>
        {error && (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-red-950/40 border border-red-900/60 p-3 text-xs text-red-400 text-center font-black uppercase tracking-wider transition-all">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#D9CFC1] mb-2">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              required
              value={nomUtilisateur}
              onChange={(e) => setNomUtilisateur(e.target.value)}
              className="w-full rounded-lg bg-[#110A06] border border-[#3E2723] p-3 text-xs font-bold text-[#EAD7C3] placeholder-stone-600 focus:outline-none focus:border-[#B07A50] focus:ring-1 focus:ring-[#B07A50] shadow-inner transition"
              placeholder="Ex: admin_mistral"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#D9CFC1] mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="w-full rounded-lg bg-[#110A06] border border-[#3E2723] p-3 text-xs font-bold text-[#EAD7C3] placeholder-stone-600 focus:outline-none focus:border-[#B07A50] focus:ring-1 focus:ring-[#B07A50] shadow-inner transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#B07A50] hover:bg-[#96633D] p-3 text-xs font-black uppercase tracking-wider text-white shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="animate-spin" size={14} /> Connexion...</>
            ) : (
              <><Lock size={14} /> Se connecter</>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};