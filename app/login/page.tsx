"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import axios from "axios";
import { api } from "@/lib/api/client";
import { useAuth } from "@/components/AuthProvider";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import NivaasLogo from "@/components/NivaasLogo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await api.auth.login({ email, password });
      
      // If the backend returns verify: false, show OTP screen
      if (response.verify === false) {
        setShowOtp(true);
        toast.success("OTP sent to your email. Please verify.");
      } else {
        toast.success("Login successful!");
        setUser(response.user);
        router.push("/dashboard");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error || "Login failed");
      } else {
        toast.error("An error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Create a verifyOTP method in api client, or just use axios directly if not added
      const response = await axios.post("/api/auth/verify-otp", { email, otp });
      if (response.status === 200) {
        toast.success("Account verified and logged in successfully!");
        // The verify-otp route sets the token and returns the user
        setUser(response.data.user);
        router.push("/dashboard");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error || "Verification failed");
      } else {
        toast.error("An error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <NivaasLogo size={40} />
          <span className="text-2xl font-bold tracking-tight">Nivaas</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Manage tiffins &<br />rentals effortlessly.
          </h1>
          <p className="text-white/70 text-lg">
            One platform for your organization&apos;s tiffin subscriptions and rental management.
          </p>
        </div>
        <div className="flex gap-6 text-white/60 text-sm">
          <span>🍱 Tiffin Tracking</span>
          <span>🏠 Rentals</span>
          <span>💰 Billing</span>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex items-center gap-3">
          <NivaasLogo size={36} />
          <span className="text-xl font-bold text-foreground">Nivaas</span>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-foreground mb-1">
            {showOtp ? "Verify your account" : "Sign in"}
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            {showOtp ? (
              "Enter the code sent to your email"
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-primary font-medium hover:underline">
                  Create one
                </Link>
              </>
            )}
          </p>

          {!showOtp ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-input bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-input bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl gradient-primary py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all mt-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Sign in <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="otp" className="text-sm font-medium text-foreground">
                  Verification Code
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full rounded-xl border border-input bg-card pl-10 pr-4 py-2.5 text-sm text-foreground tracking-widest placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition text-center font-mono font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl gradient-primary py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all mt-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Verify & Sign in <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
