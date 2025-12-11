// app/(pages)/signup/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub, FaApple } from "react-icons/fa";

export default function SignupPage() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Register the user
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      // Auto sign in after successful registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but failed to sign in. Please sign in manually.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = (provider: "google" | "github") => {
    signIn(provider, { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      
      {/* --- Left Side: Visuals & Branding --- */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-[#d9633c] text-white overflow-hidden">
        {/* Background Pattern - Abstract Curves */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-[-20%] left-[-20%] w-[100vw] h-[100vw] rounded-full border-[100px] border-white/50" />
            <div className="absolute top-[-10%] left-[-15%] w-[90vw] h-[90vw] rounded-full border-[80px] border-white/40" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
            <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight">Analyz</span>
            </Link>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-regular tracking-tight mb-4 leading-tight">
            Go ahead, start your "journey".
          </h1>
          <p className="text-white text-lg leading-relaxed">
            Join the internet's favorite club of freelancers and business owners—because what could possibly go wrong?
          </p>
        </div>
      </div>

      {/* --- Right Side: Sign Up Form --- */}
      <div className="flex items-center justify-center p-8 bg-white text-black">
        <div className="w-full max-w-md">
          
          <div className="mb-8">
            <h2 className="text-3xl font-medium tracking-tight mb-2">Create your account</h2>
            <p className="text-gray-500">
              Join the party. Set up your account the old-fashioned way; email, password, done.
            </p>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button 
              onClick={() => handleSocialSignIn("google")}
              className="flex items-center justify-center gap-2 border border-gray-200 p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <FcGoogle className="w-5 h-5" />
              Google
            </button>
            <button 
              onClick={() => handleSocialSignIn("github")}
              className="flex items-center justify-center gap-2 border border-gray-200 p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <FaGithub className="w-5 h-5" />
              GitHub
            </button>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or sign up with</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors"
                />
                <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors"
                />
                <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
                By creating an account, you agree to our <a href="#" className="text-blue-600 hover:underline">Terms of service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
            </p>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a1a1a] text-white py-3 rounded-lg font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            Already have an account? <Link href="/signin" className="text-blue-600 font-medium hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}