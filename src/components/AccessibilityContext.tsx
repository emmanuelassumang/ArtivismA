"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useTheme } from 'next-themes';

// Define the shape of our accessibility state
interface AccessibilityState {
  // UI preferences
  fontSize: number;
  isGreyscale: boolean;
  
  // Content filtering preferences
  accessibilityFilters: {
    wheelchair_accessible: boolean;
    audio_descriptions: boolean;
    low_mobility_friendly: boolean;
    child_friendly: boolean;
  };
}

// Define the context interface
interface AccessibilityContextType extends AccessibilityState {
  // Methods to update preferences
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  toggleGreyscale: () => void;
  toggleDarkMode: () => void;
  toggleAccessibilityFilter: (filter: keyof AccessibilityState['accessibilityFilters']) => void;
  resetAccessibilityFilters: () => void;
}

// Create the context with defaults
const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// Provider component
export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
  // UI state
  const [fontSize, setFontSize] = useState<number>(1);
  const [isGreyscale, setIsGreyscale] = useState<boolean>(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState<boolean>(false);
  
  // Content filtering state
  const [accessibilityFilters, setAccessibilityFilters] = useState({
    wheelchair_accessible: false,
    audio_descriptions: false,
    low_mobility_friendly: false,
    child_friendly: false
  });

  // Load saved preferences from localStorage on mount
  useEffect(() => {
    setMounted(true);
    
    // Load UI preferences
    const savedGreyscale = localStorage.getItem('greyscale') === 'true';
    if (savedGreyscale) {
      setIsGreyscale(true);
      document.documentElement.classList.add('greyscale');
    }
    
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
      const size = parseFloat(savedFontSize);
      setFontSize(size);
      document.documentElement.style.fontSize = `${size}rem`;
    }
    
    // Load accessibility filter preferences
    const savedFilters = localStorage.getItem('accessibilityFilters');
    if (savedFilters) {
      try {
        const parsedFilters = JSON.parse(savedFilters);
        setAccessibilityFilters(parsedFilters);
      } catch (error) {
        console.error('Error parsing saved accessibility filters:', error);
      }
    }
  }, []);

  // Font size handlers
  const increaseFontSize = () => {
    if (fontSize < 1.5) {
      const newSize = Math.min(1.5, fontSize + 0.1);
      setFontSize(newSize);
      document.documentElement.style.fontSize = `${newSize}rem`;
      localStorage.setItem('fontSize', newSize.toString());
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > 0.8) {
      const newSize = Math.max(0.8, fontSize - 0.1);
      setFontSize(newSize);
      document.documentElement.style.fontSize = `${newSize}rem`;
      localStorage.setItem('fontSize', newSize.toString());
    }
  };

  const resetFontSize = () => {
    setFontSize(1);
    document.documentElement.style.fontSize = '1rem';
    localStorage.setItem('fontSize', '1');
  };

  // Greyscale handler
  const toggleGreyscale = () => {
    const newValue = !isGreyscale;
    setIsGreyscale(newValue);
    
    if (newValue) {
      document.documentElement.classList.add('greyscale');
    } else {
      document.documentElement.classList.remove('greyscale');
    }
    
    localStorage.setItem('greyscale', newValue.toString());
  };

  // Dark mode handler
  const toggleDarkMode = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // Accessibility filter handlers
  const toggleAccessibilityFilter = (filter: keyof typeof accessibilityFilters) => {
    const updatedFilters = {
      ...accessibilityFilters,
      [filter]: !accessibilityFilters[filter]
    };
    
    setAccessibilityFilters(updatedFilters);
    localStorage.setItem('accessibilityFilters', JSON.stringify(updatedFilters));
  };

  const resetAccessibilityFilters = () => {
    const resetFilters = {
      wheelchair_accessible: false,
      audio_descriptions: false,
      low_mobility_friendly: false,
      child_friendly: false
    };
    setAccessibilityFilters(resetFilters);
    localStorage.setItem('accessibilityFilters', JSON.stringify(resetFilters));
  };

  // Value to be provided by the context
  const value = {
    fontSize,
    isGreyscale,
    accessibilityFilters,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    toggleGreyscale,
    toggleDarkMode,
    toggleAccessibilityFilter,
    resetAccessibilityFilters
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Custom hook to use the accessibility context
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  
  return context;
};