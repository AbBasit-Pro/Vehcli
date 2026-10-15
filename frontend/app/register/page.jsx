"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Car,
  User,
  AtSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  Zap,
} from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");

  // Validation functions
  const validateFullName = (name) => {
    if (!name.trim()) return "Full name is required";
    if (name.trim().length < 3) return "Name must be at least 3 characters";
    return "";
  };

  const validateUsername = (uname) => {
    if (!uname.trim()) return "Username is required";
    if (uname.length < 3 || uname.length > 20) return "Username must be 3-20 characters";
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(uname)) return "Only letters, numbers, and underscores (no spaces)";
    return "";
  };

  const validateEmail = (mail) => {
    if (!mail.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(mail)) return "Enter a valid email address";
    return "";
  };

  const validatePassword = (pass) => {
    if (!pass) return "Password is required";
    if (pass.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  const validateConfirmPassword = (confirm, pass) => {
    if (!confirm) return "Please confirm your password";
    if (confirm !== pass) return "Passwords do not match";
    return "";
  };

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { label: "", score: 0, color: "bg-slate-200" };
    if (pass.length < 6) return { label: "Too Short", score: 1, color: "bg-red-500" };

    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { label: "Weak", score: 1, color: "bg-amber-500" };
    if (score === 3) return { label: "Medium", score: 2, color: "bg-blue-500" };
    return { label: "Strong", score: 3, color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(formData.password);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setApiSuccess("");

    const nameErr = validateFullName(formData.full_name);
    const userErr = validateUsername(formData.username);
    const emailErr = validateEmail(formData.email);
    const passErr = validatePassword(formData.password);
    const confErr = validateConfirmPassword(formData.confirm_password, formData.password);

    setTouched({
      full_name: true,
      username: true,
      email: true,
      password: true,
      confirm_password: true,
    });

    if (nameErr || userErr || emailErr || passErr || confErr) return;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.full_name.trim(),
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setApiSuccess("Account created successfully! Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        setApiError(data.detail || "Registration failed. Please try again.");
      }
    } catch (err) {
      setApiError("Unable to connect to registration server. Please check backend status.");
    } finally {
      setLoading(false);
    }
  };

  const isFieldValid = (field) => {
    if (!touched[field]) return null;
    switch (field) {
      case "full_name":
        return !validateFullName(formData.full_name);
      case "username":
        return !validateUsername(formData.username);
      case "email":
        return !validateEmail(formData.email);
      case "password":
        return !validatePassword(formData.password);
      case "confirm_password":
        return !validateConfirmPassword(formData.confirm_password, formData.password);
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900 font-sans">
      {/* ── LEFT COLUMN: Decorative Brand Panel ── */}
      <div className="md:w-1/2 lg:w-5/12 bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white p-8 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center space-x-3 group">
            <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-lg group-hover:bg-emerald-500 transition">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                AutoDamage<span className="text-emerald-400">AI</span>
              </span>
              <span className="ml-2 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                Pakistan
              </span>
            </div>
          </Link>
        </div>

        {/* Middle Product Highlights */}
        <div className="relative z-10 my-10 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Join Pakistan's AI Automotive Network</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            Get Full Access to AI Damage Inspections & Fair Market Pricing
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
            Register your free account in under 30 seconds to inspect vehicles, export survey-ready PDF quotes, and find verified local spare parts.
          </p>

          <div className="space-y-3 pt-2">
            {[
              "Instant AI detection across Mehran, Alto, Corolla, Civic & more",
              "Realistic Pakistani labor costs tailored to 12 major cities",
              "Direct scrap market & PakWheels spare parts comparison",
              "Exportable survey reports with full legal damage audit trails",
            ].map((feat, idx) => (
              <div key={idx} className="flex items-center space-x-2.5 text-xs text-slate-200">
                <div className="w-4 h-4 rounded-full bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-slate-400">
          © 2026 AutoDamage AI Pakistan. All rights reserved.
        </div>
      </div>

      {/* ── RIGHT COLUMN: Registration Form ── */}
      <div className="md:w-1/2 lg:w-7/12 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Create an Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
              Enter your details to create your AutoDamage AI profile.
            </p>
          </div>

          {/* API Error Box */}
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-start space-x-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {/* API Success Box */}
          {apiSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-start space-x-2.5 animate-fadeIn">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
              <span>{apiSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  placeholder="e.g. Asad Khan"
                  className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                    isFieldValid("full_name") === false
                      ? "border-red-400 focus:ring-red-200"
                      : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-200"
                  }`}
                />
                {isFieldValid("full_name") !== null && (
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                    {isFieldValid("full_name") ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {touched.full_name && validateFullName(formData.full_name) && (
                <p className="text-[11px] text-red-600 font-medium">
                  {validateFullName(formData.full_name)}
                </p>
              )}
            </div>

            {/* Username */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <AtSign className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  placeholder="e.g. asad_khan"
                  className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                    isFieldValid("username") === false
                      ? "border-red-400 focus:ring-red-200"
                      : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-200"
                  }`}
                />
                {isFieldValid("username") !== null && (
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                    {isFieldValid("username") ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {touched.username && validateUsername(formData.username) && (
                <p className="text-[11px] text-red-600 font-medium">
                  {validateUsername(formData.username)}
                </p>
              )}
            </div>

            {/* Email */}
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
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="asad@example.pk"
                  className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                    isFieldValid("email") === false
                      ? "border-red-400 focus:ring-red-200"
                      : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-200"
                  }`}
                />
                {isFieldValid("email") !== null && (
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                    {isFieldValid("email") ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {touched.email && validateEmail(formData.email) && (
                <p className="text-[11px] text-red-600 font-medium">
                  {validateEmail(formData.email)}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Min. 8 characters"
                  className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                    isFieldValid("password") === false
                      ? "border-red-400 focus:ring-red-200"
                      : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-200"
                  }`}
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

              {/* Password strength bar */}
              {formData.password && (
                <div className="pt-1 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-medium">Strength:</span>
                    <span
                      className={`font-bold ${
                        strength.score === 1
                          ? "text-amber-600"
                          : strength.score === 2
                          ? "text-blue-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex space-x-1">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        strength.score >= 1 ? strength.color : "bg-transparent"
                      }`}
                      style={{ width: "33.3%" }}
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        strength.score >= 2 ? strength.color : "bg-transparent"
                      }`}
                      style={{ width: "33.3%" }}
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        strength.score >= 3 ? strength.color : "bg-transparent"
                      }`}
                      style={{ width: "33.3%" }}
                    />
                  </div>
                </div>
              )}

              {touched.password && validatePassword(formData.password) && (
                <p className="text-[11px] text-red-600 font-medium">
                  {validatePassword(formData.password)}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirm_password}
                  onChange={(e) => handleChange("confirm_password", e.target.value)}
                  placeholder="Repeat your password"
                  className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                    isFieldValid("confirm_password") === false
                      ? "border-red-400 focus:ring-red-200"
                      : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-200"
                  }`}
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
              {touched.confirm_password &&
                validateConfirmPassword(formData.confirm_password, formData.password) && (
                  <p className="text-[11px] text-red-600 font-medium">
                    {validateConfirmPassword(formData.confirm_password, formData.password)}
                  </p>
                )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="pt-4 text-center border-t border-slate-100">
            <p className="text-xs text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
