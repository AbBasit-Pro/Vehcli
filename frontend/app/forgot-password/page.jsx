"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Car,
  Mail,
  Key,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ArrowLeft,
  Info,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [demoNotice, setDemoNotice] = useState("");

  // Step 1: Request Password Reset
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setApiError("");
    setDemoNotice("");

    if (!email.trim()) {
      setApiError("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setApiError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.reset_token || data.token) {
          const t = data.reset_token || data.token;
          setResetToken(t);
          setDemoNotice(
            `Demo Mode: In production, the reset token would be emailed to you. Your reset token is: ${t}`
          );
        } else {
          setDemoNotice(
            "Demo Mode: In production, the reset token would be emailed to you. If your account exists, a token has been generated."
          );
        }
        setStep(2);
      } else {
        setApiError(data.detail || "Unable to process password reset request.");
      }
    } catch (err) {
      setApiError("Unable to connect to the authentication server. Please check backend status.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password with Token
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!resetToken.trim()) {
      setApiError("Please enter the reset token.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setApiError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setApiError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken.trim(),
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep(3);
      } else {
        setApiError(data.detail || "Password reset failed. Invalid or expired token.");
      }
    } catch (err) {
      setApiError("Failed to communicate with authentication server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-slate-900 font-sans flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Navbar Brand */}
      <div className="max-w-4xl mx-auto w-full pt-4">
        <Link href="/" className="inline-flex items-center space-x-3 group">
          <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-lg group-hover:bg-emerald-500 transition">
            <Car className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">
            AutoDamage<span className="text-emerald-400">AI</span>
          </span>
        </Link>
      </div>

      {/* Centered Card */}
      <div className="max-w-md w-full mx-auto my-auto bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-2xl space-y-6">
        {/* Step Progress Indicator */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <span
              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                step >= 1 ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              1
            </span>
            <span className="text-xs font-semibold text-slate-700">Request</span>
          </div>
          <div className="w-8 h-0.5 bg-slate-200" />
          <div className="flex items-center space-x-2">
            <span
              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                step >= 2 ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              2
            </span>
            <span className="text-xs font-semibold text-slate-700">Reset</span>
          </div>
          <div className="w-8 h-0.5 bg-slate-200" />
          <div className="flex items-center space-x-2">
            <span
              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                step >= 3 ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              3
            </span>
            <span className="text-xs font-semibold text-slate-700">Done</span>
          </div>
        </div>

        {/* Header */}
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {step === 1 && "Forgot Your Password?"}
            {step === 2 && "Enter Reset Token"}
            {step === 3 && "Password Reset Complete!"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {step === 1 && "Enter your registered email address to receive password reset instructions."}
            {step === 2 && "Enter your reset token and your new password below."}
            {step === 3 && "Your password has been successfully updated. You can now log in."}
          </p>
        </div>

        {/* Error Alert */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-start space-x-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Demo Notice */}
        {demoNotice && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs flex items-start space-x-2.5 animate-fadeIn">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-700" />
            <div className="break-all">{demoNotice}</div>
          </div>
        )}

        {/* ── STEP 1 FORM ── */}
        {step === 1 && (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-600 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Checking account...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Token</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ── STEP 2 FORM ── */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Reset Token
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Enter token from email/demo"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-600 transition font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-2.5 px-3 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <span>Set New Password</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: SUCCESS ── */}
        {step === 3 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-8 h-8 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Password Successfully Reset
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                You can now log into your account with your newly configured credentials.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Link back to login */}
        {step !== 3 && (
          <div className="pt-4 text-center border-t border-slate-100">
            <Link
              href="/login"
              className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-emerald-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        )}
      </div>

      {/* Footer credit */}
      <div className="max-w-md w-full mx-auto text-center text-[11px] text-slate-400 pb-4">
        © 2026 AutoDamage AI Pakistan. All rights reserved.
      </div>
    </div>
  );
}
