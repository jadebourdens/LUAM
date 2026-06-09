import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest, existingResponse: NextResponse) {
  let supabaseResponse = existingResponse;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;
  const pathWithoutLocale = pathname.replace(/^\/(en|vi)/, '') || '/';

  const protectedRoutes = ['/profile', '/dashboard', '/settings', '/messages', '/checkout'];
  const publicRoutes = ['/login', '/signup', '/forgot-password'];

  const isProtectedRoute = protectedRoutes.some(route => pathWithoutLocale.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathWithoutLocale.startsWith(route)) || pathWithoutLocale === '/';

  if (!session && isProtectedRoute && !isPublicRoute) {
    const locale = pathname.split('/')[1] || 'vi';
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}/login`;
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}