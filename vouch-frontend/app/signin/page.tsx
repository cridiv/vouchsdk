"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const SignInPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Clear any stale local state on signin page
    localStorage.removeItem("vouch_api_key");
    localStorage.removeItem("vouch_dev_id");
    localStorage.removeItem("vouch_dev_email");
    localStorage.removeItem("vouch_key_prefix");

    // Check if they are already logged in locally
    const devId = localStorage.getItem("vouch_dev_id");
    if (devId) {
      window.location.href = "/dashboard";
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg(null);

      const endpoint = isSignUp
        ? "http://localhost:5000/developer/signup"
        : "http://localhost:5000/developer/login";

      const body = isSignUp
        ? { email, password, name }
        : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Authentication failed.");
      }

      // Cache credentials
      localStorage.setItem("vouch_dev_id", data.developerId || "");
      localStorage.setItem("vouch_dev_email", email);
      if (data.apiKey) {
        localStorage.setItem("vouch_api_key", data.apiKey);
        localStorage.setItem("vouch_key_prefix", data.apiKey.slice(0, 16));
      }

      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Auth Error:", err);
      setErrorMsg(err.message || "Failed to authenticate. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col font-syne bg-black text-white selection:bg-[#58A0B4] selection:text-black">
      <nav className="w-full sticky top-0 z-50 backdrop-blur-md font-syne border-b border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-50">
          <div className="grid grid-cols-2 md:grid-cols-3 h-20 items-center text-sm">
            <div className="flex items-center gap-4 justify-start">
              <Link
                href="/"
                className="font-bold text-xl tracking-tight text-white z-50"
              >
                {`{`} vouch{` }`}
                <span className="text-[#58a0b4] text-3xl">.</span>sdk
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex flex-1 flex-col items-center justify-center w-full py-12">
        <div className="flex w-full max-w-[28rem] flex-col items-center gap-8 rounded-3xl bg-white/[0.02] border border-white/5 px-8 py-8 shadow-2xl relative overflow-hidden">
          {/* Header */}
          <div className="flex flex-col items-center gap-4 text-center z-10 w-full">
            <div className="inline-flex items-center px-3 py-1 bg-[#58A0B4]/10 text-[#58A0B4] text-xs font-dm-sans mb-2 border border-[#58A0B4]/20">
              Developer Portal
            </div>
            <h1 className="text-3xl font-syne font-bold tracking-tight">
              {isSignUp ? "Create Developer Account" : "Sign In to Vouch"}
            </h1>
            <p className="text-sm font-dm-sans text-gray-400">
              {isSignUp
                ? "Sign up to start integrating absolute trust into your applications."
                : "Manage your API credentials, view logs, and monitor escrow states."}
            </p>
          </div>

          {errorMsg && (
            <div className="w-full px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl font-dm-sans text-center">
              {errorMsg}
            </div>
          )}

          {/* Login/Signup Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full z-10">
            {isSignUp && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-semibold">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-[#58A0B4]/50"
                  required
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 font-semibold">Email Address</label>
              <input
                type="email"
                placeholder="dev@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-[#58A0B4]/50"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 font-semibold">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-[#58A0B4]/50"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="bg-white text-black hover:bg-gray-200 py-3.5 text-md font-syne transition-all shadow-lg hover:scale-102 mt-2"
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Connecting....</span>
                </div>
              ) : (
                isSignUp ? "Register" : "Sign In"
              )}
            </Button>

            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
              }}
              className="text-xs text-center text-gray-400 hover:text-white transition-colors mt-2"
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Create one"}
            </button>
          </form>
        </div>

        {/* Global Footer Link */}
        <div className="mt-8 flex gap-6 text-xs text-gray-600 font-dm-sans">
          <Link href="#" className="hover:text-gray-400 transition-colors">
            Privacy Policy
          </Link>
          <Link href="#" className="hover:text-gray-300 transition-colors">
            Terms of Service
          </Link>
        </div>
      </main>
    </div>
  );
};

export default SignInPage;
