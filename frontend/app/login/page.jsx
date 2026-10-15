
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Car,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  Zap,
  Check,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");

  const validateEmail = (val) => {
    if (!val) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(val)) {
      return "Please enter a valid email address";
    }

    return "";
  };

  const validatePassword = (val) => {
    if (!val) return "Password is required";

    if (val.length < 6) {
      return "Password must be at least 6 characters";
    }

    return "";
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);

    if (touched.email) {
      setErrors((prev) => ({
        ...prev,
        email: validateEmail(val),
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);

    if (touched.password) {
      setErrors((prev) => ({
        ...prev,
        password: validatePassword(val),
      }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));

    if (field === "email") {
      setErrors((prev) => ({
        ...prev,
        email: validateEmail(email),
      }));
    } else if (field === "password") {
      setErrors((prev) => ({
        ...prev,
        password: validatePassword(password),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setApiError("");
    setApiSuccess("");

    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);

    setTouched({
      email: true,
      password: true,
    });

    setErrors({
      email: emailErr,
      password: passErr,
    });

    if (emailErr || passErr) return;

    setLoading(true);

    try {
      // Use the deployed site's API route instead of localhost.
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      const data = contentType.includes("application/json")
        ? await res.json()
        : null;

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(
            "Login API route not found. Check your Vercel backend routing."
          );
        }

        if (res.status >= 500) {
          throw new Error(
            "Authentication server error. Check your backend deployment logs."
          );
        }

        throw new Error(
          data?.detail ||
            data?.message ||
            "Login failed. Please check your credentials."
        );
      }

      if (!data?.token || !data?.user) {
        throw new Error(
          "The server response is missing the login token or user information."
        );
      }

      localStorage.setItem("autodamage_token", data.token);
      localStorage.setItem(
        "autodamage_user",
        JSON.stringify(data.user)
      );

      setApiSuccess("Login successful! Redirecting to dashboard...");

      window.setTimeout(() => {
        window.location.href = "/dashboard";
      }, 800);
    } catch (err) {
      console.error("Login request failed:", err);

      setApiError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the authentication server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900 font-sans">
      {/* Left column: Brand panel */}
      <div className="md:w-1/2 lg:w-5/12 bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white p-8 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

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

        <div className="relative z-10 my-10 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Automotive Intelligence</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            Smart Vehicle Damage Inspection & Real-Time PKR Cost Estimator
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
            Sign in to access advanced YOLOv11 damage localization,
            Multi-agent LLM repair quotations, and live spare parts
            price comparisons.
          </p>

          <div className="space-y-3 pt-2">
            {[
              "99.2% damage localization accuracy across Pakistani car models",
              "Consensus PKR quotes from Ustad Rafiq, Surveyor Salman & PakWheels",
              "Direct price lookup across OLX, PakWheels, Daraz & scrap markets",
            ].map((feat, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-2.5 text-xs text-slate-200"
              >
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

      {/* Right column: Login form */}
      <div className="md:w-1/2 lg:w-7/12 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign In to Your Account
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
              Welcome back! Please enter your credentials to continue.
            </p>
          </div>

          {apiError && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-start space-x-2.5"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {apiSuccess && (
            <div
              role="status"
              className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-start space-x-2.5"
            >
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
              <span>{apiSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-bold text-slate-700"
              >
                Email Address
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => handleBlur("email")}
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                    touched.email && errors.email
                      ? "border-red-400 focus:ring-red-300"
                      : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-200"
                  }`}
                />
              </div>

              {touched.email && errors.email && (
                <p className="text-[11px] text-red-600 font-medium">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-700"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => handleBlur("password")}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                    touched.password && errors.password
                      ? "border-red-400 focus:ring-red-300"
                      : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-200"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {touched.password && errors.password && (
                <p className="text-[11px] text-red-600 font-medium">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 text-center border-t border-slate-100">
            <p className="text-xs text-slate-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
