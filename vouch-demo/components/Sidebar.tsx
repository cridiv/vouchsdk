'use client';
import React from 'react';
import { Briefcase, Receipt, Shield, LogOut, User } from 'lucide-react';
import Image from 'next/image';

interface SidebarProps {
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#0a0a0c] border-r border-white/5 p-6 fixed left-0 top-0 bottom-0 overflow-y-auto">
      {/* Brand logo */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <Image src="/plica_logo.png" alt="Plica Logo" width={32} height={32} className="w-8 h-8" />
          <span className="text-white text-xl font-bold tracking-wider">PLICA</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-purple-400 font-mono">
          <Shield className="w-3 h-3" />
          <span>Vouch Protected</span>
        </div>
      </div>
      
      {/* Main navigation */}
      <nav className="space-y-1.5 flex-1">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-600/10 text-purple-400 border border-purple-500/20 font-semibold text-sm cursor-pointer">
          <Briefcase className="w-4 h-4" />
          <span>Projects Escrow</span>
        </button>
      </nav>
      
      {/* Logout / Profile at bottom */}
      <div className="pt-6 border-t border-white/5 space-y-1.5">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all font-semibold text-sm cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;