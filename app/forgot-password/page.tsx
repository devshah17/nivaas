"use client";

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { Mail, ArrowLeft, ArrowRight, Lock, Loader2 } from "lucide-react";
import NivaasLogo from "@/components/NivaasLogo";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();
  const { setUser } = useAuth();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post("/api/auth/forgot-password", { email });
      toast.success("OTP sent to your email!");
      setShowOtp(true);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error || "Failed to send OTP");
      } else {
        toast.error("An error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await axios.post("/api/auth/reset-password", { email, otp, password });
      if (response.status === 200) {
        toast.success("Password reset successfully!");
        setUser(response.data.user);
        router.push("/dashboard");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.error || "Failed to reset password");
      } else {
        toast.error("An error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <NivaasLogo size={32} />
          <span className="font-bold text-foreground">Nivaas</span>
        </div>

        {!showOtp ? (
          <>
            <h2 className="text-2xl font-bold text-foreground mb-1">Forgot password?</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Enter your email and we&apos;ll send you a verification code.
            </p>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl gradient-primary py-2.5 text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-60 transition-all mt-2"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>Send verification code <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-foreground mb-1">Reset your password</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Enter the code sent to your email and your new password.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
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

              <div className="space-y-1">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
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
                    Reset & Sign in <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
