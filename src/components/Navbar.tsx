"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserIcon } from "lucide-react";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  userId: string;
  exp: number;
  iat: number;
}

const Navbar = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setUserId(decoded.userId);
      } catch (error) {
        console.error("Invalid token", error);
        setUserId(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUserId(null);
    setIsDropdownOpen(false);
    router.push("/login");
  };

  const isLightBgPage =
    pathname === "/map" ||
    pathname.startsWith("/tours") ||
    pathname.startsWith("/art") ||
    pathname === "/about" ||
    pathname === "/gallery" ||
    pathname === "/#about";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isLightBgPage ? "bg-white/95 backdrop-blur-sm text-gray-900 shadow-lg" : "bg-transparent text-white"
      }`}
    >
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className={`text-2xl font-bold transition-all duration-300 transform hover:scale-105 ${
            isLightBgPage ? "text-indigo-700" : "text-white"
          }`}
        >
          Artivism
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex space-x-6">
          {[
            { href: "/", label: "Home" },
            { href: "/gallery", label: "Gallery" },
            { href: "/map", label: "Map" },
            { href: "/tours", label: "Tours" },
            { href: "/#about", label: "About" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative py-2 px-1 transition-colors hover:text-indigo-500 ${
                isLightBgPage ? "text-gray-800" : "text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA and Profile */}
        <div className="hidden md:flex space-x-4 items-center relative">
          {/* Explore Map button */}
          <Link
            href="/map"
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center h-10"
          >
            Explore Map
          </Link>

          {/* Profile Icon */}
          {userId ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 p-2 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-md flex items-center justify-center h-10 w-10"
              >
                <UserIcon className="h-5 w-5" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg">
                  <Link
                    href={`/profile/${userId}`}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 p-2 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-md flex items-center justify-center h-10 w-10"
            >
              <UserIcon className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
