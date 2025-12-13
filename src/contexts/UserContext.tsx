// UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserType = 'viewer' | 'provider';

interface UserContextType {
  userType: UserType;
  changeUserType: (type: UserType) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUserType = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserType must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userType, setUserType] = useState<UserType>('viewer');

  useEffect(() => {
    const storedType = localStorage.getItem('userType') as UserType | null;
    if (storedType === 'viewer' || storedType === 'provider') {
      setUserType(storedType);
    }
  }, []);

  const changeUserType = (type: UserType) => {
    localStorage.setItem('userType', type);
    setUserType(type);
  };

  const value = {
    userType,
    changeUserType,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
