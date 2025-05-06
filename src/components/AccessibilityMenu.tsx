"use client";

import { useState, useEffect } from 'react';
import { useAccessibility } from './AccessibilityContext';

const AccessibilityMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'display' | 'content'>('display');
  const [mounted, setMounted] = useState(false);
  
  // Use the accessibility context instead of local state
  const {
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
  } = useAccessibility();

  // Handle hydration mismatch - only render after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Function to check if any accessibility filters are active
  const hasActiveFilters = Object.values(accessibilityFilters).some(value => value);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <button
        aria-label="Accessibility Options"
        onClick={toggleMenu}
        className="relative bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="w-6 h-6"
        >
          <circle cx="12" cy="7" r="2.5" strokeWidth="2" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 19v-3c0-2-2-3-3.5-3h-7c-1.5 0-3.5 1-3.5 3v3"
          />
          <path
            strokeLinecap="round"
            strokeWidth="2"
            d="M9 13.5V19"
          />
          <path
            strokeLinecap="round"
            strokeWidth="2"
            d="M15 13.5V19"
          />
          <path
            strokeLinecap="round"
            strokeWidth="2"
            d="M9 17h6"
          />
        </svg>
        
        {/* Notification dot when filters are active */}
        {hasActiveFilters && (
          <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {isOpen && mounted ? (
        <div className="absolute bottom-16 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-80">
          <h3 className="text-lg font-semibold mb-3 dark:text-white">Accessibility Options</h3>
          
          {/* Tab navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            <button
              onClick={() => setActiveTab('display')}
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === 'display'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Display
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`py-2 px-4 text-sm font-medium relative ${
                activeTab === 'content'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Content Filters
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </button>
          </div>
          
          {/* Display settings tab */}
          {activeTab === 'display' && (
            <div>
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
                  <div className="toggle-switch relative inline-block w-10 align-middle select-none">
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
                      className={`toggle-dot absolute left-1 top-1 bg-white dark:bg-gray-200 w-4 h-4 rounded-full transition-transform transform ${
                        isGreyscale ? 'translate-x-4' : 'translate-x-0'
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
                  <div className="toggle-switch relative inline-block w-10 align-middle select-none">
                    <input
                      type="checkbox"
                      id="darkMode"
                      onChange={toggleDarkMode}
                      className="sr-only"
                    />
                    <div
                      className="block h-6 rounded-full w-10 bg-gray-300 dark:bg-blue-600"
                    ></div>
                    <div
                      className="toggle-dot absolute left-1 top-1 bg-white dark:bg-gray-200 w-4 h-4 rounded-full transition-transform transform dark:translate-x-4"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Content filter settings tab */}
          {activeTab === 'content' && (
            <div>
              <p className="text-sm mb-3 dark:text-white">Show artworks accessible for:</p>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="wheelchair_accessible"
                    type="checkbox"
                    checked={accessibilityFilters.wheelchair_accessible}
                    onChange={() => toggleAccessibilityFilter('wheelchair_accessible')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="wheelchair_accessible" className="ml-2 block text-sm dark:text-white">
                    Wheelchair Accessible
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="audio_descriptions"
                    type="checkbox"
                    checked={accessibilityFilters.audio_descriptions}
                    onChange={() => toggleAccessibilityFilter('audio_descriptions')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="audio_descriptions" className="ml-2 block text-sm dark:text-white">
                    Audio Descriptions
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="low_mobility_friendly"
                    type="checkbox"
                    checked={accessibilityFilters.low_mobility_friendly}
                    onChange={() => toggleAccessibilityFilter('low_mobility_friendly')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="low_mobility_friendly" className="ml-2 block text-sm dark:text-white">
                    Low Mobility Friendly
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="child_friendly"
                    type="checkbox"
                    checked={accessibilityFilters.child_friendly}
                    onChange={() => toggleAccessibilityFilter('child_friendly')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="child_friendly" className="ml-2 block text-sm dark:text-white">
                    Child Friendly
                  </label>
                </div>
              </div>
              
              {hasActiveFilters && (
                <button
                  onClick={resetAccessibilityFilters}
                  className="mt-4 px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-200"
                >
                  Reset All Filters
                </button>
              )}
              
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  These filters will automatically apply when browsing artworks in the gallery and map.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default AccessibilityMenu;