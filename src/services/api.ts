import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
const API_URL ="mistralcoffeback-production-d59d.up.railway.app/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mistral_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      try {
        const userDataString = localStorage.getItem('mistral_user');
        const user = userDataString ? JSON.parse(userDataString) : null;

        if (user && user.id) {
          await axios.post(`${API_URL}/auth/logout-expired`, {
            utilisateurId: user.id
          });
        }
      } catch (logoutError) {
        console.error("Shift closure/Logout failed:", logoutError);
      } finally {
        localStorage.removeItem('mistral_token');
        localStorage.removeItem('mistral_user');
        const auth = useContext(AuthContext);
        auth?.resetAuthState();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
