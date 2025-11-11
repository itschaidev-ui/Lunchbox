'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type NavbarContextType = {
  isNavbarVisible: boolean;
  toggleNavbar: () => void;
  showNavbar: () => void;
  hideNavbar: () => void;
};

const NavbarContext = createContext<NavbarContextType | undefined>(undefined);

export function NavbarProvider({ children }: { children: ReactNode }) {
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);

  const toggleNavbar = () => {
    setIsNavbarVisible(!isNavbarVisible);
  };

  const showNavbar = () => {
    setIsNavbarVisible(true);
  };

  const hideNavbar = () => {
    setIsNavbarVisible(false);
  };

  return (
    <NavbarContext.Provider value={{
      isNavbarVisible,
      toggleNavbar,
      showNavbar,
      hideNavbar
    }}>
      {children}
    </NavbarContext.Provider>
  );
}

export function useNavbar() {
  const context = useContext(NavbarContext);
  if (context === undefined) {
    throw new Error('useNavbar must be used within a NavbarProvider');
  }
  return context;
}
