'use client'
import React, { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const NavBar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (!isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    document.body.style.overflow = 'unset';
  };

  return (
    <>
      <div className="flex justify-center bg-black text-white relative">
        <nav className="px-4 md:px-8 py-4 max-w-6xl w-full">
          <div className="flex justify-between items-center w-full backdrop-blur-md bg-[#060606] border border-white/10 rounded-4xl px-4 md:px-6 py-3 shadow-[0_0_3px_#8E24AA]">
            <div className="flex items-center gap-2 text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-purple-600">
              <Image src="/plica_logo.png" alt="Plica Logo" width={32} height={32} className="w-8 h-8" />
              Plica
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <ul className="flex space-x-8">
                <li>
                  <a
                    href="/about"
                    className="px-4 py-2 rounded-lg transition-all duration-300 hover:text-[#bf00ff] hover:scale-105"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    className="px-4 py-2 rounded-lg transition-all duration-300 hover:text-[#bf00ff] hover:scale-105"
                  >
                    Contact
                  </a>
                </li>
              </ul>
              <Link
                href="/auth"
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-600 text-white rounded-4xl font-semibold transition-all duration-300 shadow-[8px_8px_16px_rgba(0,0,0,0.4),-8px_-8px_16px_rgba(191,0,255,0.1)] hover:shadow-[4px_4px_8px_rgba(0,0,0,0.6),-4px_-4px_8px_rgba(191,0,255,0.2)] active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(191,0,255,0.1)] border border-purple-600/30 hover:bg-purple-600"
              >
                <span>Sign up</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg transition-all duration-300 hover:text-[#bf00ff] hover:scale-105"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeMobileMenu} />
          <div className="absolute top-20 left-4 right-4 bg-[#060606] border border-white/10 rounded-2xl shadow-[0_0_2px_#8E24AA] p-6">
            <ul className="space-y-4 mb-6">
              <li>
                <a
                  href="/about"
                  onClick={closeMobileMenu}
                  className="block px-4 py-3 rounded-lg transition-all duration-300 hover:text-[#bf00ff] hover:bg-white/5 text-center"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={closeMobileMenu}
                  className="block px-4 py-3 rounded-lg transition-all duration-300 hover:text-[#bf00ff] hover:bg-white/5 text-center"
                >
                  Contact
                </a>
              </li>
            </ul>
            <Link
              href="/auth"
              onClick={closeMobileMenu}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-600 text-white rounded-2xl font-semibold transition-all duration-300 shadow-[8px_8px_16px_rgba(0,0,0,0.4),-8px_-8px_16px_rgba(191,0,255,0.1)] hover:shadow-[4px_4px_8px_rgba(0,0,0,0.6),-4px_-4px_8px_rgba(191,0,255,0.2)] active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(191,0,255,0.1)] border border-purple-600/30 hover:bg-purple-600"
            >
              <span>Sign up</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default NavBar;