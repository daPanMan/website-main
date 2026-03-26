// Cloudflare Worker — Groq API proxy with web search tool for jpswag.com
// Secrets required (set in Cloudflare dashboard):
//   GROQ_API_KEY   — Groq API key
//   TAVILY_API_KEY — Tavily search API key (free tier: tavily.com)

const ALLOWED_ORIGINS = ['https://jpswag.com', 'https://www.jpswag.com', 'http://localhost:8000'];
const GROQ_ENDPOINT   = 'https://api.groq.com/openai/v1/chat/completions';
const TAVILY_ENDPOINT = 'https://api.tavily.com/search';

// Tool definition — tells Groq it can call this when it needs fresh info
const SEARCH_TOOL = {
    type: 'function',
    function: {
        name: 'search_web',
        description: 'Search the web for up-to-date information about a topic, person, event, or fact. Use this whenever you are uncertain or your training data may be outdated.',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'The search query — be specific for better results.'
                }
            },
            required: ['query']
        }
    }
};

export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin') || '';

        // CORS preflight
        if (request.method === 'OPTIONS') {
            return corsResponse(null, 204, origin);
        }

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

        // Inject the search tool into every request
        // Use 'auto' but the system prompt strongly instructs the model to search
        // for any real person, recent event, or uncertain topic.
        body.tools = [SEARCH_TOOL];
        body.tool_choice = 'auto';

        // Append a reminder to the last user message to nudge the model to search
        // when it's asking about people or topics it might not know well.
        const msgs = body.messages;
        if (msgs && msgs.length > 0) {
            const last = msgs[msgs.length - 1];
            if (last.role === 'user') {
                last.content = last.content +
                    '\n\n[System hint: If this message asks about a real person, recent event, or any topic you are not 100% certain about, you MUST call search_web before answering. Do not guess.]';
            }
        }

        // ── Round 1: ask Groq (may respond with a tool call) ──
        const round1 = await callGroq(body, env.GROQ_API_KEY);
        if (!round1.ok) {
            const err = await round1.json();
            return corsResponse(JSON.stringify(err), round1.status, origin);
        }

        const data1 = await round1.json();
        const choice1 = data1.choices?.[0];

        // No tool call — just return the answer directly
        if (choice1?.finish_reason !== 'tool_calls') {
            return corsResponse(JSON.stringify(data1), 200, origin);
        }

        // ── Tool call: execute the search ──
        const toolCall = choice1.message.tool_calls?.[0];
        if (!toolCall || toolCall.function.name !== 'search_web') {
            return corsResponse(JSON.stringify(data1), 200, origin);
        }

        let searchQuery, searchResults;
        try {
            searchQuery = JSON.parse(toolCall.function.arguments).query;
            searchResults = await runSearch(searchQuery, env.TAVILY_API_KEY);
        } catch (e) {
            // Tavily failed — retry Groq without tools so it still gives an answer
            console.error('Search failed:', e);
            const fallbackBody = {
                model:       body.model,
                messages:    body.messages,
                max_tokens:  body.max_tokens,
                temperature: body.temperature,
            };
            const fallback = await callGroq(fallbackBody, env.GROQ_API_KEY);
            const fallbackData = await fallback.json();
            return corsResponse(JSON.stringify(fallbackData), fallback.status, origin);
        }

        // ── Round 2: feed search results back to Groq ──
        const messages2 = [
            ...body.messages,
            choice1.message,  // assistant's tool_calls message
            {
                role: 'tool',
                tool_call_id: toolCall.id,
                content: searchResults
            }
        ];

        const body2 = {
            model:       body.model,
            messages:    messages2,
            max_tokens:  body.max_tokens,
            temperature: body.temperature,
            // No tools in round 2 — just get the final answer
        };

        const round2 = await callGroq(body2, env.GROQ_API_KEY);
        const data2 = await round2.json();
        return corsResponse(JSON.stringify(data2), round2.status, origin);
    }
};

// ── Helpers ──────────────────────────────────────────────────────────────────

async function callGroq(body, apiKey) {
    return fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });
}

async function runSearch(query, apiKey) {
    const res = await fetch(TAVILY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            api_key:                apiKey,
            query:                  query,
            search_depth:           'basic',
            max_results:            4,
            include_answer:         true,
            include_raw_content:    false,
        }),
    });

    if (!res.ok) throw new Error(`Tavily ${res.status}`);
    const data = await res.json();

    // Build a compact summary for the model
    const lines = [];
    if (data.answer) {
        lines.push(`Summary: ${data.answer}`);
    }
    (data.results || []).slice(0, 3).forEach((r, i) => {
        lines.push(`[${i + 1}] ${r.title}: ${r.content?.slice(0, 300)}...`);
    });
    return lines.join('\n\n') || 'No results found.';
}

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
