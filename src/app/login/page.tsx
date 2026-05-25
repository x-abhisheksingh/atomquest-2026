
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ChevronDown } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  const fillDemo = (role: 'employee' | 'manager' | 'admin') => {
    setEmail(`${role}@demo.com`)
    setPassword('Demo@123')
    setShowDemo(false)
  }

  return (
    <div className="min-h-screen flex bg-[#0f0f1a]">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#1A1A2E] p-12">
        <div className="text-2xl font-bold text-white">
          Atom<span className="text-red-400">Quest</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Track goals.
            <br />
            Drive performance.
            <br />
            <span className="text-red-400">Stay aligned.</span>
          </h1>

          <p className="text-white/40 text-sm">
            Atomberg Technologies · Internal Goal Setting Portal
          </p>
        </div>

        <div className="flex gap-8 text-white/30 text-xs">
          <span>AtomQuest 1.0</span>
          <span>FY 2026-27</span>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-2xl font-bold text-white mb-8">
            Atom<span className="text-red-400">Quest</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">
            Sign in
          </h2>

          <p className="text-white/40 text-sm mb-8">
            Enter your credentials to continue
          </p>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Email address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@atomberg.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 pr-10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                >
                  {showPassword ? (
                    <EyeOff size={15} />
                  ) : (
                    <Eye size={15} />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            {/* Login button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>

            {/* Demo credentials */}
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowDemo(!showDemo)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-white/40 hover:text-white/60 hover:bg-white/5 transition"
              >
                <span>Use demo credentials</span>

                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    showDemo ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showDemo && (
                <div className="border-t border-white/10 divide-y divide-white/5">
                  {(['employee', 'manager', 'admin'] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => fillDemo(role)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition text-left"
                    >
                      <span className="text-white/60 text-xs capitalize">
                        {role}
                      </span>

                      <span className="text-white/30 text-xs">
                        {role}@demo.com
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Register link */}
            <p className="text-center text-xs text-white/30">
              Don't have an account?{' '}
              <Link
                href="/register"
                className="text-red-400 hover:text-red-300 transition"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
