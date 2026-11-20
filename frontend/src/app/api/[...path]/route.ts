import { NextRequest, NextResponse } from 'next/server';

function getBackendBase(): string {
  const isDev = process.env.NODE_ENV !== 'production';
  const defaultBackend = isDev ? 'http://127.0.0.1:5000' : 'https://guardian-angel-703744831646.us-central1.run.app';
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    defaultBackend
  ).replace(/\/+$/, '');
}

async function handleProxy(request: NextRequest) {
  const backendBase = getBackendBase();
  const targetUrl = `${backendBase}${request.nextUrl.pathname}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!['host', 'connection'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  const method = request.method.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      const bodyBytes = await request.arrayBuffer();
      if (bodyBytes && bodyBytes.byteLength > 0) {
        init.body = bodyBytes;
      }
    } catch (e) {
      console.warn('Proxy request body read warning:', e);
    }
  }

  try {
    const backendRes = await fetch(targetUrl, init);

    const responseHeaders = new Headers();
    backendRes.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    return new NextResponse(backendRes.body, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error(`Proxy error forwarding to ${targetUrl}:`, err);
    return NextResponse.json(
      {
        status: 'error',
        message: `Failed to connect to backend service (${err.message || 'Network error'}).`,
      },
      { status: 502 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
export const OPTIONS = handleProxy;
