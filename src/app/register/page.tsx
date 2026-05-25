'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'EMPLOYEE' | 'MANAGER'>('EMPLOYEE')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async () => {
    setError('')

    if (!name.trim()) { setError('Full name is required'); return }
    if (!email.trim()) { setError('Email is required'); return }
    if (!password.trim()) { setError('Password is required'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }

    setLoading(true)

    try {
      const supabase = createClient()

      // Step 1: Sign up
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: undefined }
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      const userId = data.user?.id
      if (!userId) {
        setError('Could not create account. Try a different email.')
        setLoading(false)
        return
      }

      // Step 2: Create DB profile
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, name: name.trim(), email: email.trim(), role })
      })

      if (!res.ok) {
        const err = await res.json()
        if (res.status !== 409) {
          setError(err.error || 'Failed to create profile')
          setLoading(false)
          return
        }
      }

      // Step 3: Sign in immediately
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (signInError) {
        setError('Account created! Email confirmation may be required. Please check your inbox or sign in manually.')
        setLoading(false)
        router.push('/login')
        return
      }

      if (!signInData.session) {
        setError('Account created! Please check your email to confirm, then sign in.')
        setLoading(false)
        router.push('/login')
        return
      }

      // Step 4: Redirect
      window.location.href = '/dashboard'

    } catch (err: any) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
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
            Join your team.<br />Set your goals.<br />
            <span className="text-red-400">Make an impact.</span>
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
          <div className="lg:hidden text-2xl font-bold text-white mb-8">
            Atom<span className="text-red-400">Quest</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Create account</h2>
          <p className="text-white/40 text-sm mb-8">Fill in your details to get started</p>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Abhishek Singh"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@atomberg.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 pr-10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">I am a</label>
              <div className="grid grid-cols-2 gap-2">
                {(['EMPLOYEE', 'MANAGER'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2.5 rounded-lg text-sm font-medium transition border ${
                      role === r
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <p className="text-white/20 text-xs mt-1.5">Admin accounts are created by HR only</p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>

            <p className="text-center text-xs text-white/30">
              Already have an account?{' '}
              <Link href="/login" className="text-red-400 hover:text-red-300 transition">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
