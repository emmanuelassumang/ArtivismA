"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const isLightBgPage =
  pathname === "/map" ||
  pathname.startsWith("/tours") ||
  pathname.startsWith("/art") ||
  pathname === "/about" ||
  pathname === "/gallery" ||
  pathname === "/#about";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const isActive = useCallback(
    (href: string) => {
      if (href === '/') return pathname === href;
      return pathname.startsWith(href);
    },
    [pathname]
  );

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled || isLightBgPage
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
                isScrolled || isLightBgPage ? 'text-indigo-700' : 'text-white'
              }`}
            >
              <span className="flex items-center">
                <svg viewBox="0 0 24 24" className="h-7 w-7 mr-2 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.42 4.58C19.99 4.15 19.41 3.9 18.83 3.9H18.12L16.19 2.5C15.11 1.73 13.85 1.3 12.5 1.3C11.18 1.3 9.89 1.73 8.81 2.5L6.88 3.9H6.17C5.58 3.9 5.01 4.15 4.58 4.58C4.14 5.01 3.9 5.58 3.9 6.17V18.83C3.9 20.07 4.9 21.09 6.14 21.1H18.85C20.1 21.09 21.1 20.07 21.1 18.83V6.17C21.1 5.58 20.85 5.01 20.42 4.58ZM8.5 5.7L11.6 3.46L13.4 3.46L16.5 5.7L12.5 9L8.5 5.7ZM12.5 12.73C11.56 12.73 10.8 11.97 10.8 11.03C10.8 10.08 11.56 9.33 12.5 9.33C13.44 9.33 14.2 10.08 14.2 11.03C14.2 11.97 13.44 12.73 12.5 12.73Z"/>
                </svg>
                Artivism
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex space-x-6">
              {[
                { href: '/', label: 'Home' },
                { href: '/gallery', label: 'Gallery' },
                { href: '/map', label: 'Map' },
                { href: '/tours', label: 'Tours' },
                { href: '/#about', label: 'About', isAnchor: true }
              ].map((link) => (
                <React.Fragment key={link.href}>
                  {link.isAnchor ? (
                    <a
                      href={link.href}
                      className={`relative py-2 px-1 transition-colors hover:text-indigo-500 ${
                        isScrolled || isLightBgPage ? 'text-gray-800' : 'text-white'
                      }`}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className={`relative py-2 px-1 transition-colors hover:text-indigo-500 ${
                        isScrolled || isLightBgPage ? 'text-gray-800' : 'text-white'
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

            {/* CTA */}
            <div className="hidden md:block">
              <Link
                href="/map"
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-5 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                Explore Map
              </Link>
            </div>

            {/* Mobile Menu Icon */}
            <button
              className="md:hidden transition-transform duration-300 hover:rotate-180"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-6 w-6 ${isScrolled || isLightBgPage ? 'text-gray-900' : 'text-white'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
