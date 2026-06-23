import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: number;
  nomUtilisateur: string;
  role: 'ADMIN' | 'GERANT';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Rehydrate authentications state on page refresh
    const savedToken = localStorage.getItem('mistral_token');
    const savedUser = localStorage.getItem('mistral_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('mistral_token', newToken);
    localStorage.setItem('mistral_user', JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      const savedToken = localStorage.getItem('mistral_token');
      
      if (savedToken) {
        // 🟢 Utilisation de ton instance Axios (l'intercepteur s'occupe d'injecter le Bearer Token)
        // Note: '/auth/logout' s'ajoute automatiquement à ton baseURL 'http://localhost:3000/api'
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error("Échec de la notification de déconnexion au serveur:", error);
    } finally {
      // 🧼 Nettoyage local obligatoire (s'exécute même si le serveur ne répond pas)
      setToken(null);
      setUser(null);
      localStorage.removeItem('mistral_token');
      localStorage.removeItem('mistral_user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};