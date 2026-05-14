import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/pricing', '/auth/callback']

const TIER_ROUTES: Record<string, string[]> = {
  '/dashboard/case-practice': ['m2', 'm3'],
  '/dashboard/community': ['m2', 'm3'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Auth callback'i geç
  if (pathname.startsWith('/auth/')) {
    return NextResponse.next()
  }

  const { supabaseResponse, user, supabase } = await updateSession(request)

  const isDashboard = pathname.startsWith('/dashboard')

  // Dashboard rotaları için auth kontrolü
  if (isDashboard && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Login/signup sayfasında oturum açıksa dashboard'a yönlendir
  if ((pathname === '/login' || pathname === '/signup') && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Tier bazlı erişim kontrolü
  if (isDashboard && user) {
    for (const [route, allowedTiers] of Object.entries(TIER_ROUTES)) {
      if (pathname.startsWith(route)) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier, subscription_status')
          .eq('id', user.id)
          .maybeSingle()

        const p = profile as { subscription_tier: string; subscription_status: string } | null

        if (
          !p ||
          !allowedTiers.includes(p.subscription_tier) ||
          p.subscription_status === 'inactive'
        ) {
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard'
          url.searchParams.set('upgrade', 'true')
          url.searchParams.set('requiredTier', allowedTiers[0])
          return NextResponse.redirect(url)
        }
        break
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
