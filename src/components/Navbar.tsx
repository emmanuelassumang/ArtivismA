"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);
  
  // Function to determine if a link is active
  const isActive = useCallback(
    (href: string) => {
      if (href === '/') {
        return pathname === href;
      }
      return pathname.startsWith(href);
    },
    [pathname]
  );
  
  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-sm text-gray-900 shadow-lg' 
            : 'bg-transparent text-white'
        }`}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link 
              href="/" 
              className={`text-2xl font-bold transition-all duration-300 transform hover:scale-105 ${
                isScrolled ? 'text-indigo-700' : 'text-white'
              }`}
            >
              <span className="flex items-center">
                <svg viewBox="0 0 24 24" className="h-7 w-7 mr-2 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.42 4.58C19.99 4.15 19.41 3.9 18.83 3.9H18.12L16.19 2.5C15.11 1.73 13.85 1.3 12.5 1.3C11.18 1.3 9.89 1.73 8.81 2.5L6.88 3.9H6.17C5.58 3.9 5.01 4.15 4.58 4.58C4.14 5.01 3.9 5.58 3.9 6.17V18.83C3.9 20.07 4.9 21.09 6.14 21.1H18.85C20.1 21.09 21.1 20.07 21.1 18.83V6.17C21.1 5.58 20.85 5.01 20.42 4.58ZM8.5 5.7L11.6 3.46L13.4 3.46L16.5 5.7L12.5 9L8.5 5.7ZM12.5 12.73C11.56 12.73 10.8 11.97 10.8 11.03C10.8 10.08 11.56 9.33 12.5 9.33C13.44 9.33 14.2 10.08 14.2 11.03C14.2 11.97 13.44 12.73 12.5 12.73Z"/>
                </svg>
                Artivism
              </span>
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-6">
              {[
                { href: '/', label: 'Home' },
                { href: '/map', label: 'Map' },
                { href: '/tours', label: 'Tours' },
                { href: '/#about', label: 'About', isAnchor: true }
              ].map((link) => (
                <React.Fragment key={link.href}>
                  {link.isAnchor ? (
                    <a 
                      href={link.href}
                      className={`relative py-2 px-1 transition-colors hover:text-indigo-500 ${
                        isScrolled ? 'text-gray-800' : 'text-white'
                      }`}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link 
                      href={link.href}
                      className={`relative py-2 px-1 transition-colors hover:text-indigo-500 ${
                        isScrolled ? 'text-gray-800' : 'text-white'
                      }`}
                    >
                      {link.label}
                      {isActive(link.href) && (
                        <span className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-600 rounded-full transition-all"></span>
                      )}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </div>
            
            {/* Get Started Button (Desktop) */}
            <div className="hidden md:block">
              <Link 
                href="/map" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-5 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                Explore Map
              </Link>
            </div>
            
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden transition-transform duration-300 hover:rotate-180"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-6 w-6 ${isScrolled ? 'text-gray-900' : 'text-white'}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                ) : (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 6h16M4 12h16M4 18h16" 
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>
      
      {/* Mobile Menu (Overlay) */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />
      
      {/* Mobile Menu Content */}
      <div 
        className={`fixed top-0 right-0 h-full w-64 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <Link href="/" className="text-xl font-bold text-indigo-700">
              Artivism
            </Link>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setIsMenuOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex flex-col space-y-6">
            {[
              { href: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { href: '/map', label: 'Map', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
              { href: '/tours', label: 'Tours', icon: 'M9 6l3 3m0 0l3-3m-3 3V2m0 16l-3-3m3 3l3-3m-3 3V14' },
              { href: '/#about', label: 'About', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', isAnchor: true }
            ].map((link) => (
              <div key={link.href}>
                {link.isAnchor ? (
                  <a 
                    href={link.href}
                    className={`flex items-center text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors ${
                      isActive(link.href) ? 'text-indigo-600 bg-indigo-50' : ''
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                    </svg>
                    {link.label}
                  </a>
                ) : (
                  <Link 
                    href={link.href}
                    className={`flex items-center text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors ${
                      isActive(link.href) ? 'text-indigo-600 bg-indigo-50' : ''
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                    </svg>
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
          
          {/* Mobile CTA */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link
              href="/map"
              className="btn-primary w-full text-center inline-block"
            >
              Explore Map
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;