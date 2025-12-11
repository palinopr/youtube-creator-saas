import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes that require authentication
const protectedRoutes = [
  "/videos",
  "/video",
  "/clips",
  "/analysis",
  "/optimize",
  "/deep-analysis",
  "/advanced-insights",
  "/why-it-works",
  "/settings",
  "/admin",
];

// Public routes that don't require authentication
const publicRoutes = ["/", "/login", "/pricing"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // If not a protected route, allow access
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // For protected routes, check for auth cookie or session
  // The backend uses session cookies, so we check if any youtube_tokens exist
  // This is a client-hint approach - actual auth verification happens on API calls
  const cookies = request.cookies;

  // Check for session indicator (customize based on your auth setup)
  // Since we use httpOnly cookies managed by FastAPI, we can't directly read them
  // Instead, we'll let the page load and handle auth redirect client-side
  // This middleware just provides a fast redirect for obvious unauthenticated states

  // For now, we'll allow the request to proceed
  // The page components will handle auth checking via the API
  // This approach avoids issues with httpOnly cookies

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled by backend)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)",
  ],
};
