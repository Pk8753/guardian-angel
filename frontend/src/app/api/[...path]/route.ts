import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_GEMINI_MODELS = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    badge: 'Next Gen Fast',
    description: 'High-speed multimodal intelligence for instant answers'
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro Preview',
    badge: 'Deep Reasoning',
    description: 'Advanced reasoning model for complex clinical genetics'
  },
  {
    id: 'gemini-3.0-flash',
    name: 'Gemini 3.0 Flash',
    badge: 'Production Fast',
    description: 'Standard fast and reliable clinical reasoning model'
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    badge: 'Stable Fast',
    description: 'Comprehensive genomic and multi-source reasoning'
  }
];

let fallbackGlobalGeminiKey = (process.env.GEMINI_API_KEY || '').trim();
let fallbackGlobalGeminiModel = (process.env.GEMINI_MODEL || 'gemini-3.8-flash').trim();

function handleConfigFallback(): NextResponse {
  return NextResponse.json({
    status: 'success',
    has_key: Boolean(fallbackGlobalGeminiKey),
    ai_mode: fallbackGlobalGeminiKey ? 'online' : 'offline',
    current_model: fallbackGlobalGeminiModel,
    models: DEFAULT_GEMINI_MODELS
  });
}

function handleRemoveConfigFallback(): NextResponse {
  fallbackGlobalGeminiKey = '';
  return NextResponse.json({
    status: 'success',
    has_key: false,
    ai_mode: 'offline',
    message: 'Gemini API key has been removed globally.'
  });
}

function handleSaveConfigFallback(bodyJson: any): NextResponse {
  const apiKey = (bodyJson?.api_key || bodyJson?.gemini_api_key || '').trim();
  const modelId = (bodyJson?.model_id || bodyJson?.model || fallbackGlobalGeminiModel || 'gemini-3.8-flash').trim();
  if (!apiKey) {
    return NextResponse.json({ status: 'error', message: 'API key cannot be empty' }, { status: 400 });
  }
  fallbackGlobalGeminiKey = apiKey;
  if (modelId) fallbackGlobalGeminiModel = modelId;
  return NextResponse.json({
    status: 'success',
    has_key: true,
    ai_mode: 'online',
    current_model: fallbackGlobalGeminiModel,
    message: 'Gemini API key saved globally across all devices.'
  });
}

function getBackendBase(): string {
  const isDev = process.env.NODE_ENV !== 'production';
  const defaultBackend = isDev ? 'http://127.0.0.1:5000' : 'https://guardian-angel-703744831646.us-central1.run.app';
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    defaultBackend
  ).replace(/\/+$/, '');
}

async function handleGeminiModelsFallback(request: NextRequest): Promise<NextResponse> {
  const apiKey = (
    request.nextUrl.searchParams.get('key') ||
    request.nextUrl.searchParams.get('api_key') ||
    fallbackGlobalGeminiKey ||
    process.env.GEMINI_API_KEY ||
    ''
  ).trim();

  const hasKey = Boolean(apiKey || fallbackGlobalGeminiKey);
  const currentModel = fallbackGlobalGeminiModel;

  if (apiKey) {
    try {
      const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (gRes.ok) {
        const data = await gRes.json();
        const rawModels = data.models || [];
        const supported: any[] = [];
        const seenIds = new Set<string>();

        for (const m of rawModels) {
          const methods = m.supportedGenerationMethods || [];
          if (methods.includes('generateContent')) {
            const mId = (m.name || '').replace('models/', '');
            const low = mId.toLowerCase();
            if (low.includes('gemini') && !['embedding', 'aqa', 'vision', 'tuned', 'thinking', '2.5-pro', '2.0', '1.5', '1.0'].some((bad: string) => low.includes(bad))) {
              const vMatch = low.match(/gemini-(\d+(?:\.\d+)?)/);
              if (vMatch) {
                const ver = parseFloat(vMatch[1]);
                if (ver >= 2.5 && !seenIds.has(mId)) {
                  seenIds.add(mId);
                  supported.push({
                    id: mId,
                    name: m.displayName || mId,
                    badge: ver >= 3.0 ? 'Next Gen' : 'Stable',
                    description: (m.description || '').slice(0, 100),
                    version: ver
                  });
                }
              }
            }
          }
        }
        supported.sort((a, b) => (b.version || 0) - (a.version || 0));
        return NextResponse.json({
          status: 'success',
          has_key: hasKey,
          current_model: currentModel,
          models: supported.length > 0 ? supported : DEFAULT_GEMINI_MODELS
        });
      }
    } catch (e) {
      console.warn('Fallback Gemini models fetch error:', e);
    }
  }

  return NextResponse.json({
    status: 'success',
    has_key: hasKey,
    current_model: currentModel,
    models: DEFAULT_GEMINI_MODELS
  });
}

async function handleTestGeminiConnectionFallback(bodyJson: any): Promise<NextResponse> {
  const apiKey = (bodyJson?.api_key || bodyJson?.gemini_api_key || fallbackGlobalGeminiKey || '').trim();
  const modelId = (bodyJson?.model_id || bodyJson?.model || fallbackGlobalGeminiModel || 'gemini-3.8-flash').trim();
  if (!apiKey) {
    return NextResponse.json({
      status: 'error',
      message: 'API key cannot be empty. Please enter an API key or configure one globally.'
    }, { status: 400 });
  }

  try {
    const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`, {
      signal: AbortSignal.timeout(12000),
    });

    if (gRes.ok) {
      const data = await gRes.json();
      const rawModels = data.models || [];
      const supported: any[] = [];
      const seenIds = new Set<string>();

      for (const m of rawModels) {
        const methods = m.supportedGenerationMethods || [];
        if (methods.includes('generateContent')) {
          const mId = (m.name || '').replace('models/', '');
          const low = mId.toLowerCase();
          if (low.includes('gemini') && !['embedding', 'aqa', 'vision', 'tuned', 'thinking', '2.5-pro', '2.0', '1.5', '1.0'].some((bad: string) => low.includes(bad))) {
            const vMatch = low.match(/gemini-(\d+(?:\.\d+)?)/);
            if (vMatch) {
              const ver = parseFloat(vMatch[1]);
              if (ver >= 2.5 && !seenIds.has(mId)) {
                seenIds.add(mId);
                supported.push({
                  id: mId,
                  name: m.displayName || mId,
                  badge: ver >= 3.0 ? 'Next Gen' : 'Stable',
                  description: (m.description || '').slice(0, 100),
                  version: ver
                });
              }
            }
          }
        }
      }
      supported.sort((a, b) => (b.version || 0) - (a.version || 0));
      const finalModels = supported.length > 0 ? supported : DEFAULT_GEMINI_MODELS;

      fallbackGlobalGeminiKey = apiKey;
      if (modelId) {
        fallbackGlobalGeminiModel = modelId;
      }

      return NextResponse.json({
        status: 'success',
        message: `Successfully connected to Google AI Studio (${finalModels.length} models verified for chat & analysis).`,
        models: finalModels,
        has_key: true,
        current_model: fallbackGlobalGeminiModel
      });
    } else {
      let errMsg = `HTTP ${gRes.status}`;
      try {
        const errData = await gRes.json();
        errMsg = errData.error?.message || errMsg;
      } catch {}
      return NextResponse.json({
        status: 'error',
        message: `Gemini connection failed: ${errMsg}`
      }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      message: `Connection error: ${err.message || 'Could not connect to Google AI Studio'}`
    }, { status: 400 });
  }
}

async function handleAskStudioFallback(bodyJson: any): Promise<NextResponse> {
  const apiKey = (bodyJson?.api_key || bodyJson?.gemini_api_key || fallbackGlobalGeminiKey || process.env.GEMINI_API_KEY || '').trim();
  const query = (bodyJson?.query || '').trim();
  let model = (bodyJson?.model || fallbackGlobalGeminiModel || 'gemini-3.8-flash').replace('models/', '').trim();
  if (!model || ['2.5-pro', '2.0', '1.5', '1.0'].some((leg: string) => model.toLowerCase().includes(leg))) {
    model = 'gemini-3.8-flash';
  }

  if (!apiKey) {
    return NextResponse.json({
      status: 'error',
      message: 'No Google AI Studio Gemini API Key configured. Please add your key in Settings.'
    }, { status: 400 });
  }

  if (!query) {
    return NextResponse.json({
      status: 'error',
      message: 'Query cannot be empty.'
    }, { status: 400 });
  }

  const viewMode = bodyJson?.view_mode || 'provider';
  const currentPage = bodyJson?.current_page || 'Care AI';
  const pageContext = bodyJson?.page_context || '';

  const systemInstruction = `You are Care AI, the conversational premarital clinical genetics assistant for GuardianAngel.
User Lens: ${viewMode === 'provider' ? 'Clinical genetics specialist mode. Provide quantitative risk assessment, ACMG guidelines, and precise diagnostic recommendations.' : 'Patient/Family mode. Provide clear, empathetic, culturally sensitive guidance with zero medical jargon.'}
Current Screen: ${currentPage}.
Context: ${pageContext}
Provide evidence-based guidance for premarital carrier screening, autosomal recessive inheritance risk, and reproductive counseling (IVF with PGT-M).`;

  const contents: any[] = [];
  const history = Array.isArray(bodyJson?.conversation_history) ? bodyJson.conversation_history : [];
  for (const h of history.slice(-6)) {
    if (h && typeof h === 'object' && h.text) {
      contents.push({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: String(h.text) }]
      });
    }
  }
  contents.push({
    role: 'user',
    parts: [{ text: query }]
  });

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        contents,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        }
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (geminiRes.ok) {
      const data = await geminiRes.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
      return NextResponse.json({
        status: 'success',
        answer,
        model_used: model,
        source: 'Google AI Studio'
      });
    } else {
      let errDetail = `HTTP ${geminiRes.status}`;
      try {
        const errJson = await geminiRes.json();
        errDetail = errJson.error?.message || errDetail;
      } catch {}
      return NextResponse.json({
        status: 'error',
        message: `Gemini API error: ${errDetail}`
      }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      message: `Failed to connect to Google AI Studio: ${err.message || 'Unknown network error'}`
    }, { status: 502 });
  }
}

async function handleProxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const backendBase = getBackendBase();
  const targetUrl = `${backendBase}${pathname}${request.nextUrl.search}`;

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

  let bodyJson: any = null;
  const method = request.method.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      const bodyBytes = await request.arrayBuffer();
      if (bodyBytes && bodyBytes.byteLength > 0) {
        init.body = bodyBytes;
        try {
          const textDecoder = new TextDecoder();
          bodyJson = JSON.parse(textDecoder.decode(bodyBytes));
        } catch {}
      }
    } catch (e) {
      console.warn('Proxy request body read warning:', e);
    }
  }

  if (fallbackGlobalGeminiKey && bodyJson && !bodyJson.api_key && !bodyJson.gemini_api_key) {
    if (pathname === '/api/ai/ask-studio' || pathname === '/api/ai/analyze-assessment') {
      bodyJson.api_key = fallbackGlobalGeminiKey;
      const jsonStr = JSON.stringify(bodyJson);
      init.body = Buffer.from(jsonStr);
      headers.set('content-length', String(Buffer.byteLength(jsonStr)));
    }
  }

  try {
    const backendRes = await fetch(targetUrl, init);

    // If backend returns 404 (e.g. older backend deployment missing AI Studio endpoints), provide direct fallback
    if (backendRes.status === 404) {
      if (pathname === '/api/ai/config') {
        return handleConfigFallback();
      }
      if (pathname === '/api/ai/save-gemini-config') {
        return handleSaveConfigFallback(bodyJson);
      }
      if (pathname === '/api/ai/remove-gemini-config') {
        return handleRemoveConfigFallback();
      }
      if (pathname === '/api/ai/models') {
        return await handleGeminiModelsFallback(request);
      }
      if (pathname === '/api/ai/test-gemini-connection') {
        return await handleTestGeminiConnectionFallback(bodyJson);
      }
      if (pathname === '/api/ai/ask-studio') {
        return await handleAskStudioFallback(bodyJson);
      }
    }

    if ((pathname === '/api/ai/test-gemini-connection' || pathname === '/api/ai/save-gemini-config') && backendRes.ok && bodyJson?.api_key) {
      fallbackGlobalGeminiKey = bodyJson.api_key;
      if (bodyJson.model_id) fallbackGlobalGeminiModel = bodyJson.model_id;
    }
    if (pathname === '/api/ai/remove-gemini-config' && backendRes.ok) {
      fallbackGlobalGeminiKey = '';
    }

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
    // If backend is unreachable or down, provide direct fallback for AI studio endpoints
    if (pathname === '/api/ai/config') {
      return handleConfigFallback();
    }
    if (pathname === '/api/ai/save-gemini-config') {
      return handleSaveConfigFallback(bodyJson);
    }
    if (pathname === '/api/ai/remove-gemini-config') {
      return handleRemoveConfigFallback();
    }
    if (pathname === '/api/ai/models') {
      return await handleGeminiModelsFallback(request);
    }
    if (pathname === '/api/ai/test-gemini-connection') {
      return await handleTestGeminiConnectionFallback(bodyJson);
    }
    if (pathname === '/api/ai/ask-studio') {
      return await handleAskStudioFallback(bodyJson);
    }

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
