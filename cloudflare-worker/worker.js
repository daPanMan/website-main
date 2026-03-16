// Cloudflare Worker — Groq API proxy for jpswag.com
// Deploy this to Cloudflare Workers. Set GROQ_API_KEY as an environment secret.
// Only requests from your domain are allowed through.

const ALLOWED_ORIGINS = ['https://jpswag.com', 'https://www.jpswag.com', 'http://localhost:8000'];
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin') || '';

        // CORS preflight
        if (request.method === 'OPTIONS') {
            return corsResponse(null, 204, origin);
        }

        // Only allow POST from your domain
        if (request.method !== 'POST') {
            return corsResponse('Method not allowed', 405, origin);
        }
        if (!ALLOWED_ORIGINS.includes(origin)) {
            return corsResponse('Forbidden', 403, origin);
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return corsResponse('Invalid JSON', 400, origin);
        }

        // Forward to Groq with the secret key (never exposed to client)
        const groqRes = await fetch(GROQ_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.GROQ_API_KEY}`,
            },
            body: JSON.stringify(body),
        });

        const data = await groqRes.json();
        return corsResponse(JSON.stringify(data), groqRes.status, origin);
    }
};

function corsResponse(body, status, origin) {
    const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowed,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    return new Response(body, { status, headers });
}
