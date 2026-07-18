import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimit: Ratelimit | null = null;
let strictRatelimit: Ratelimit | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = Redis.fromEnv();
    // Default rate limit for search and related: 60 req / 60s
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "60 s"),
      analytics: true,
    });
    // Stricter limit for /api/mixed and /api/mixed_search: 20 req / 60s
    // because these endpoints fan out to multiple upstream calls.
    strictRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "60 s"),
      analytics: true,
    });
  }
} catch (e) {
  console.error("Failed to initialize Upstash Ratelimit:", e);
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // We only rate limit our data API routes.
  // /api/image_proxy is excluded because it streams and is CDN-cached.
  if (path.startsWith('/api/') && !path.startsWith('/api/image_proxy')) {
    if (!ratelimit || !strictRatelimit) {
      return NextResponse.next();
    }

    // In newer Next.js versions, request.ip is deprecated/removed from types.
    // Fall back to standard headers.
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1';
    
    let limitResult;
    if (path.startsWith('/api/mixed')) {
      limitResult = await strictRatelimit.limit(ip);
    } else {
      limitResult = await ratelimit.limit(ip);
    }

    if (!limitResult.success) {
      return new NextResponse(
        JSON.stringify({ error: 'Too Many Requests' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limitResult.limit.toString(),
            'X-RateLimit-Remaining': limitResult.remaining.toString(),
            'X-RateLimit-Reset': limitResult.reset.toString(),
            'Retry-After': Math.ceil((limitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', limitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', limitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', limitResult.reset.toString());
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
