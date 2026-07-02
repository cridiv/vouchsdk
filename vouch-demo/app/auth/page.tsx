'use client';
import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, User, ArrowRight, Briefcase } from 'lucide-react';
import { Vouch } from '@/lib/vouch-sdk/vouch';
import Image from 'next/image';

const vouch = new Vouch('vouch_e62a93d67ead621439fcb0569e920c8e6988c7b533dc2845', {
  apiUrl: 'http://localhost:5000',
  verifyUrl: 'http://localhost:3001',
});

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'BUYER' | 'FREELANCER'>('BUYER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all required fields.');
      return;
    }

    if (isLogin) {
      // ── Sign In Logic ──────────────────────────────────────────────────────
      const savedUserStr = localStorage.getItem(`user_${email}`);
      if (!savedUserStr) {
        setError('No account registered with this email. Please sign up!');
        return;
      }

      const savedUser = JSON.parse(savedUserStr);
      if (savedUser.password !== password) {
        setError('Invalid password. Please try again.');
        return;
      }

      // Log in
      localStorage.setItem('current_user', JSON.stringify({
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role,
        isVerified: true
      }));
      
      window.location.href = '/dashboard';
    } else {
      // ── Sign Up Logic (Requires Vouch SDK Verification) ────────────────────
      setError(null);
      
      vouch.identity.verify(email)
        .then((result: any) => {
          // Save user record to mock database (localStorage)
          const userPayload = {
            email,
            password,
            name,
            role,
            isVerified: true,
            createdAt: new Date().toISOString()
          };

          localStorage.setItem(`user_${email}`, JSON.stringify(userPayload));
          
          // Log user in
          localStorage.setItem('current_user', JSON.stringify({
            email: userPayload.email,
            name: userPayload.name,
            role: userPayload.role,
            isVerified: true
          }));

          window.location.href = '/dashboard';
        })
        .catch((err: any) => {
          if (err?.cancelled) {
            setError('Verification cancelled by user.');
          } else {
            setError(err?.message || 'Identity verification failed.');
          }
        });
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4 relative font-sans selection:bg-purple-500 selection:text-white">
      {/* Background glow animations */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#0a0a0c] border border-white/5 rounded-3xl p-8 shadow-2xl relative">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Image src="/plica_logo.png" alt="Plica Logo" width={40} height={40} className="w-10 h-10" />
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent font-sans">
              Plica
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            {isLogin ? 'Sign in to access your secure escrow dashboard' : 'Join Plica and protect your payments with Vouch'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-600" />
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#111115] border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-600" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111115] border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-600" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#111115] border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Select Your Role</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('BUYER')}
                  className={`py-3.5 rounded-xl border font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    role === 'BUYER'
                      ? 'bg-purple-600/10 border-purple-500 text-purple-400'
                      : 'bg-[#111115] border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Buyer / Hirer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('FREELANCER')}
                  className={`py-3.5 rounded-xl border font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    role === 'FREELANCER'
                      ? 'bg-purple-600/10 border-purple-500 text-purple-400'
                      : 'bg-[#111115] border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Freelancer</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isLogin ? 'Sign In' : 'Proceed to Identity Scan'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <p className="text-sm text-gray-500">
            {isLogin ? "Don't have an account?" : 'Already registered?'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-purple-400 hover:text-purple-300 font-semibold ml-1.5 focus:outline-none cursor-pointer"
            >
              {isLogin ? 'Create one now' : 'Sign in here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}