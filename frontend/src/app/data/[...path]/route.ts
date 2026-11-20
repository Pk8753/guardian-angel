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

async function handleDataProxy(request: NextRequest) {
  const backendBase = getBackendBase();
  const targetUrl = `${backendBase}${request.nextUrl.pathname}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!['host', 'connection'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  try {
    const backendRes = await fetch(targetUrl, {
      method: request.method,
      headers,
      redirect: 'manual',
    });

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
    console.error(`Data proxy error forwarding to ${targetUrl}:`, err);
    return NextResponse.json(
      { status: 'error', message: 'Resource unavailable' },
      { status: 502 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const GET = handleDataProxy;
export const HEAD = handleDataProxy;
