import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const urlParams = new URL(req.url).searchParams;
  const targetUrl = urlParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const parsedUrl = new URL(targetUrl);
    const domain = parsedUrl.hostname;
    const allowedDomains = ["pinimg.com", "i.pinimg.com", "pinterest.com"];

    if (!allowedDomains.some(d => domain === d || domain.endsWith(`.${d}`))) {
      return new NextResponse('Forbidden domain', { status: 403 });
    }

    const imageRes = await fetch(targetUrl);
    
    if (!imageRes.ok) {
      return new NextResponse('Failed to fetch image', { status: imageRes.status });
    }

    // Convert fetch response to Next.js Response
    const headers = new Headers(imageRes.headers);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    // Ensure content type is set
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'image/jpeg');
    }

    return new NextResponse(imageRes.body, {
      status: 200,
      headers: headers
    });

  } catch (err: any) {
    console.error("Image Proxy Error:", err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
