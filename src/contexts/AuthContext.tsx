import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, userService, vipService } from '../services/api';


interface User {
  id: string;
  username: string;
  email: string;
  profile_image: string;
}


interface AuthContextType {
  user: User | null;
  ProfileImage: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  isVip?: boolean;
  vipSet: (isVip: boolean) => void;
  vipExpiration?: Date;
  vipExpirationSet: (date: Date) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, profileImage?: File | null) => Promise<void>;
  updateUserProfile: (updatedData: { username?: string; profile_image?: string }) => void;
  logout: () => void;
  error: string | null;
  refreshVipStatus: () => Promise<void>;
}


export const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ProfileImage, setProfileImage] = useState('');
  const [isVip, setIsVip] = useState<boolean | undefined>(undefined);
  const [vipExpiration, setVipExpiration] = useState<Date | undefined>(undefined);


  useEffect(() => {
    // Check if user is already logged in via token in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuthStatus();
    } else {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userService.getPublicUserProfile(user?.username!);
        console.log("Sidebar response user: ", response?.data.user.profile_image);
        setProfileImage(response?.data.user.profile_image || '');
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }
    if (user) {
      fetchProfile();
    }
  }, [user]);


  const checkAuthStatus = async () => {
    try {
      const response = await api.get('/api/auth/user');
      setUser(response.data);
      console.log("Auth user:", response.data);
      
      // Fetch VIP status after user is set
      await fetchVipStatus();
    } catch (err) {
      console.error('Authentication check failed', err);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false);
    }
  };


  const fetchVipStatus = async () => {
    try {
      const response = await vipService.getVipStatus();
      const { isVip: vipStatus, vipExpiration: expiration } = response.data;
      setIsVip(vipStatus);
      if (expiration) {
        setVipExpiration(new Date(expiration));
      }
    } catch (error) {
      console.error('Error fetching VIP status:', error);
      setIsVip(false);
    }
  };


  const refreshVipStatus = async () => {
    if (user) {
      await fetchVipStatus();
    }
  };


  const login = async (email: string, password: string) => {
    setError(null);
    try {
      setIsLoading(true);
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user } = response.data;


      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      // Fetch VIP status after login
      await fetchVipStatus();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  const signup = async (username: string, email: string, password: string, profileImage?: File | null) => {
    setError(null);
    try {
      setIsLoading(true);
     
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('password', password);
     
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }


      const response = await api.post('/api/auth/signup', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
     
      const { token, user } = response.data;


      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      // Fetch VIP status after signup
      await fetchVipStatus();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Signup failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  const updateUserProfile = (updatedData: { username?: string; profile_image?: string }) => {
    setUser(prev => prev ? {
      ...prev,
      username: updatedData.username || prev.username,
      profile_image: updatedData.profile_image || prev.profile_image
    } : null);
   
    // Update ProfileImage state as well
    if (updatedData.profile_image) {
      setProfileImage(updatedData.profile_image);
    }
  };


  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setProfileImage('');
    setIsVip(false);
    setVipExpiration(undefined);
  };


  const vipSet = (isVip: boolean) => {
    setIsVip(isVip);
  };


  const vipExpirationSet = (date: Date) => {
    setVipExpiration(date);
  };


  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    ProfileImage,
    isVip,
    vipSet,
    vipExpiration,
    vipExpirationSet,
    login,
    signup,
    updateUserProfile,
    logout,
    error,
    refreshVipStatus,
  };


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};