import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('vb_token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Configure default base URL for API calls
  const API_URL = 'http://localhost:5000/api/v1';

  // Initialize and check current authentication state
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('vb_token');
      if (storedToken) {
        try {
          // Verify access token by fetching me profile
          const response = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          setUser(response.data.data.user);
          setToken(storedToken);
        } catch (err) {
          console.error('Failed to restore auth session:', err);
          // Attempt token refresh
          const storedRefresh = localStorage.getItem('vb_refresh_token');
          if (storedRefresh) {
            try {
              const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {
                refreshToken: storedRefresh,
              });
              const newAccessToken = refreshResponse.data.data.accessToken;
              localStorage.setItem('vb_token', newAccessToken);
              setToken(newAccessToken);
              
              const userResponse = await axios.get(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${newAccessToken}` },
              });
              setUser(userResponse.data.data.user);
            } catch (refreshErr) {
              console.error('Failed to refresh token:', refreshErr);
              logoutClean();
            }
          } else {
            logoutClean();
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const logoutClean = () => {
    localStorage.removeItem('vb_token');
    localStorage.removeItem('vb_refresh_token');
    setToken(null);
    setUser(null);
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { accessToken, refreshToken, user: loggedUser } = response.data.data;
      
      localStorage.setItem('vb_token', accessToken);
      localStorage.setItem('vb_refresh_token', refreshToken);
      setToken(accessToken);
      setUser(loggedUser);
      return loggedUser;
    } catch (err) {
      throw err.response?.data?.error || { message: 'Network connection failed' };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { name, email, password, role });
      return response.data.data;
    } catch (err) {
      throw err.response?.data?.error || { message: 'Network connection failed' };
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('vb_refresh_token');
    try {
      await axios.post(
        `${API_URL}/auth/logout`,
        { refreshToken },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      logoutClean();
      navigate('/login');
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin',
    isProcurementOfficer: user?.role === 'procurement_officer',
    isManager: user?.role === 'manager',
    isVendor: user?.role === 'vendor',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
