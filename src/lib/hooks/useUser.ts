'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Fetch user on mount
    const fetchUser = async () => {
      setLoading(true)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { setUser(null); setLoading(false); return }

      const res = await fetch('/api/users/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    fetchUser()

    // Re-fetch whenever auth state changes (login/logout/switch)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser()
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
