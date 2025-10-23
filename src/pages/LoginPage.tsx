// src/pages/LoginPage.tsx
import { useState } from "react"
import type { FormEvent } from "react"
import { useAuth } from "@/app/AuthProvider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Lock, Mail, NotebookPen, Sparkles, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const { loading, signIn } = useAuth()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await signIn(email, password)
      // No navegamos: App cambiará a Dashboard cuando user exista
    } catch (err: any) {
      setError(err?.message ?? "Unable to sign in")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin" />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-slate-900 animate-pulse" />
        </div>
        <p className="mt-4 text-slate-600 font-medium animate-pulse">Loading your workspace...</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 overflow-hidden">
      {/* Animated background elements */}
      <div className="pointer-events-none absolute inset-0">
        {/* Main gradient blobs */}
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/40 blur-3xl animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-200/30 to-blue-200/30 blur-3xl animate-[float_10s_ease-in-out_infinite_2s]" />
        <div className="absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-gradient-to-br from-pink-200/20 to-orange-200/20 blur-3xl animate-[float_12s_ease-in-out_infinite_4s]" />
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 h-2 w-2 rounded-full bg-indigo-400/30 animate-[particle_6s_ease-in-out_infinite]" />
        <div className="absolute top-2/3 right-1/4 h-3 w-3 rounded-full bg-cyan-400/20 animate-[particle_8s_ease-in-out_infinite_2s]" />
        <div className="absolute bottom-1/4 left-2/3 h-2 w-2 rounded-full bg-purple-400/25 animate-[particle_7s_ease-in-out_infinite_3s]" />
      </div>

      {/* Grid pattern overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="relative z-10 min-h-screen grid place-items-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Welcome text */}
          <div className="text-center space-y-3 opacity-0 animate-[fadeInUp_.6s_ease-out_forwards]">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent">
              Welcome back! 👋
            </h1>
            <p className="text-slate-600 text-lg">Sign in to continue with your work</p>
          </div>

          <Card className="w-full rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-[0_20px_70px_rgba(15,23,42,0.1)] opacity-0 translate-y-3 animate-[fadeInUp_.7s_ease-out_.2s_forwards] hover:shadow-[0_25px_80px_rgba(15,23,42,0.15)] transition-all duration-500">
            <CardHeader className="text-center space-y-4 pb-6">
              {/* Logo with animations */}
              <div className="mx-auto inline-flex items-center justify-center rounded-2xl p-4 bg-gradient-to-br from-slate-900 to-slate-700 relative group overflow-hidden shadow-lg">
                {/* Shimmer effect */}
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                {/* Rotating ring */}
                <span className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-white/20 animate-[spin_8s_linear_infinite]" style={{ maskImage: 'radial-gradient(farthest-side, transparent 55%, #000 56%)' }} />
                
                <NotebookPen className="relative h-8 w-8 text-white animate-[wiggle_1s_ease-in-out_2s]" />
                
                {/* Corner decorations */}
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-[sparkle_2s_ease-in-out_infinite]" />
              </div>
              
              <div className="space-y-1">
                <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Daily
                </CardTitle>
                <p className="text-slate-500 text-sm font-medium">Your technical ticket journal</p>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email field */}
                <div className="space-y-2 group/field">
                  <Label 
                    htmlFor="email" 
                    className="text-sm font-semibold text-slate-700 flex items-center gap-2"
                  >
                    Email address
                    {focusedField === 'email' && (
                      <span className="text-xs text-indigo-600 animate-[fadeIn_.3s_ease-out]">✨</span>
                    )}
                  </Label>
                  <div className="relative group">
                    <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-300 ${
                      focusedField === 'email' ? 'text-indigo-600 scale-110' : 'text-slate-400'
                    }`} />
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="tu@email.com"
                      className="pl-11 pr-4 h-12 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 
                      focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500 
                      transition-all duration-300 focus:shadow-[0_0_0_4px_rgba(99,102,241,.1)]
                      hover:border-slate-300"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-2 group/field">
                  <Label 
                    htmlFor="password" 
                    className="text-sm font-semibold text-slate-700 flex items-center gap-2"
                  >
                    Password
                    {focusedField === 'password' && (
                      <span className="text-xs text-indigo-600 animate-[fadeIn_.3s_ease-out]">🔒</span>
                    )}
                  </Label>
                  <div className="relative group">
                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-300 ${
                      focusedField === 'password' ? 'text-indigo-600 scale-110 rotate-[-5deg]' : 'text-slate-400'
                    }`} />
                    <Input
                      id="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      className="pl-11 pr-4 h-12 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 
                      focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500 
                      transition-all duration-300 focus:shadow-[0_0_0_4px_rgba(99,102,241,.1)]
                      hover:border-slate-300"
                    />
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 animate-[shake_.5s_ease-in-out]">
                    <p className="text-sm text-red-600 font-medium flex items-center gap-2">
                      <span className="text-lg">⚠️</span>
                      {error}
                    </p>
                  </div>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="group h-12 w-full rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white font-semibold tracking-wide 
                  hover:from-slate-800 hover:to-slate-600 active:scale-[0.98] 
                  transition-all duration-300 shadow-lg hover:shadow-xl
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  relative overflow-hidden"
                >
                  {/* Button shimmer effect */}
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  
                  <span className="relative flex items-center justify-center gap-2">
                    {submitting ? (
                      <>
                        <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </>
                    )}
                  </span>
                </Button>
              </form>

              {/* Footer text */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-center text-xs text-slate-500">
                  Sign in securely with your credentials 🔐
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes particle {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(50px, -100px) scale(1.5); opacity: 0.8; }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg) scale(1.05); }
          75% { transform: rotate(5deg) scale(1.05); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.5; transform: scale(0.8) rotate(180deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.2); }
          50% { transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [class*="animate-"] { animation: none !important; }
          [class*="transition-"] { transition: none !important; }
        }
      `}</style>
    </div>
  )
}
