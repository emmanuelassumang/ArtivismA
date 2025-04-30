"use client";

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

const AccessibilityMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(1);
  const [isGreyscale, setIsGreyscale] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Handle hydration mismatch - only render theme components after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const increaseFontSize = () => {
    if (fontSize < 1.5) {
      const newSize = fontSize + 0.1;
      setFontSize(newSize);
      document.documentElement.style.fontSize = `${newSize}rem`;
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > 0.8) {
      const newSize = fontSize - 0.1;
      setFontSize(newSize);
      document.documentElement.style.fontSize = `${newSize}rem`;
    }
  };

  const resetFontSize = () => {
    setFontSize(1);
    document.documentElement.style.fontSize = '1rem';
  };

  const toggleGreyscale = () => {
    setIsGreyscale(!isGreyscale);
    if (!isGreyscale) {
      document.documentElement.classList.add('greyscale');
    } else {
      document.documentElement.classList.remove('greyscale');
    }
  };

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <button
        aria-label="Accessibility Options"
        onClick={toggleMenu}
        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18 18v-3a2 2 0 00-2-2h-2.76a2 2 0 00-1.8 1.13L10 17l-1.44-2.87a2 2 0 00-1.8-1.13H4a2 2 0 00-2 2v3"
          />
          <circle cx="12" cy="7" r="4" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 13v6M16 16h6"
          />
        </svg>
      </button>

      {isOpen && mounted && (
        <div className="absolute bottom-16 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-64">
          <h3 className="text-lg font-semibold mb-3 dark:text-white">Accessibility Options</h3>
          
          <div className="mb-4">
            <p className="text-sm mb-2 dark:text-white">Text Size</p>
            <div className="flex items-center justify-between">
              <button
                onClick={decreaseFontSize}
                className="bg-gray-200 dark:bg-gray-700 p-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                aria-label="Decrease text size"
              >
                <span className="text-sm dark:text-white">A-</span>
              </button>
              <button
                onClick={resetFontSize}
                className="bg-gray-200 dark:bg-gray-700 p-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600 mx-2"
                aria-label="Reset text size"
              >
                <span className="text-sm dark:text-white">Reset</span>
              </button>
              <button
                onClick={increaseFontSize}
                className="bg-gray-200 dark:bg-gray-700 p-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                aria-label="Increase text size"
              >
                <span className="text-sm dark:text-white">A+</span>
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between">
              <label htmlFor="greyscale" className="text-sm dark:text-white">
                Greyscale Mode
              </label>
              <div className="relative inline-block w-10 align-middle select-none">
                <input
                  type="checkbox"
                  id="greyscale"
                  checked={isGreyscale}
                  onChange={toggleGreyscale}
                  className="sr-only"
                />
                <div
                  className={`block h-6 rounded-full w-10 ${
                    isGreyscale ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                ></div>
                <div
                  className={`absolute left-1 top-1 bg-white dark:bg-gray-200 w-4 h-4 rounded-full transition-transform transform ${
                    isGreyscale ? 'translate-x-4' : ''
                  }`}
                ></div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between">
              <label htmlFor="darkMode" className="text-sm dark:text-white">
                Dark Mode
              </label>
              <div className="relative inline-block w-10 align-middle select-none">
                <input
                  type="checkbox"
                  id="darkMode"
                  checked={theme === 'dark'}
                  onChange={toggleDarkMode}
                  className="sr-only"
                />
                <div
                  className={`block h-6 rounded-full w-10 ${
                    theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                ></div>
                <div
                  className={`absolute left-1 top-1 bg-white dark:bg-gray-200 w-4 h-4 rounded-full transition-transform transform ${
                    theme === 'dark' ? 'translate-x-4' : ''
                  }`}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityMenu;