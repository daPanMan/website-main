// AI Chatbox - fully AI-driven via Groq API
import CONFIG from './chatbot-config.js';

const chatbox = document.getElementById('chatbox');
const header = document.getElementById('chatbox-header');
const toggle = document.getElementById('chatbox-toggle');
const messages = document.getElementById('chatbox-messages');
const input = document.getElementById('chatbox-input');
const sendBtn = document.getElementById('chatbox-send');

// Apply config to UI
document.getElementById('chatbox-title').textContent = CONFIG.headerTitle;
input.placeholder = CONFIG.ui.placeholder;
sendBtn.textContent = CONFIG.ui.sendButton;

// Set initial greeting from config
messages.querySelector('.chat-msg.bot').textContent = CONFIG.greeting;

let collapsed = CONFIG.ui.collapsedByDefault;
if (collapsed) chatbox.classList.add('chatbox-collapsed');

function addMessage(text, sender, isAI = false) {
    const div = document.createElement('div');
    div.className = `chat-msg ${sender}${isAI ? ' ai' : ''}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

// Conversation history for AI context
const conversationHistory = [];

// Rate limiting
let lastApiCall = 0;
const MIN_API_INTERVAL = 1500; // 1.5s between calls (Groq allows 30/min)

async function getAIResponse(userText) {
    if (!CONFIG.api.enabled || !CONFIG.api.apiKey) {
        return { text: "Hmm, something's off with my setup. Try again later! 😅", fromAI: false };
    }

    // Client-side rate limiting
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    if (timeSinceLastCall < MIN_API_INTERVAL) {
        await new Promise(r => setTimeout(r, MIN_API_INTERVAL - timeSinceLastCall));
    }
    lastApiCall = Date.now();

    // Add user message to history
    conversationHistory.push({ role: 'user', content: userText });

    // Build messages array with system prompt + history
    const apiMessages = [
        { role: 'system', content: CONFIG.api.systemPrompt }
    ];
    // Keep last 20 messages for context
    const recentHistory = conversationHistory.slice(-20);
    for (const msg of recentHistory) {
        apiMessages.push({ role: msg.role, content: msg.content });
    }

    try {
        const res = await fetch(CONFIG.api.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.api.apiKey}`
            },
            body: JSON.stringify({
                model: CONFIG.api.model,
                messages: apiMessages,
                max_tokens: CONFIG.api.maxTokens,
                temperature: CONFIG.api.temperature
            })
        });

        if (res.status === 429) {
            console.warn('Groq 429 — rate limited');
            conversationHistory.pop();
            return { text: "Whoa, too many messages! Give me a sec to catch my breath 😅", fromAI: false };
        }

        if (!res.ok) {
            const errText = await res.text();
            console.error(`Groq API ${res.status}:`, errText);
            conversationHistory.pop();
            return { text: "Something went wrong on my end — try again? 😅", fromAI: false };
        }

        const data = await res.json();

        if (data.choices && data.choices[0]?.message?.content) {
            const reply = data.choices[0].message.content.trim();
            conversationHistory.push({ role: 'assistant', content: reply });
            // Trim history if too long
            if (conversationHistory.length > 30) {
                conversationHistory.splice(0, 2);
            }
            return { text: reply, fromAI: true };
        }

        console.warn('Groq: unexpected response', data);
        conversationHistory.pop();
        return { text: "Hmm, I got a weird response. Try asking again! 🤔", fromAI: false };

    } catch (err) {
        console.error('Chatbox API error:', err);
        conversationHistory.pop();
        return { text: "Couldn't reach my brain right now — try again in a sec! 🧠", fromAI: false };
    }
}

async function handleSend() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    input.value = '';

    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-msg bot typing';
    typingDiv.textContent = '...';
    messages.appendChild(typingDiv);
    messages.scrollTop = messages.scrollHeight;

    const result = await getAIResponse(text);

    typingDiv.remove();
    addMessage(result.text, 'bot', result.fromAI);

    // Auto-close chatbox on goodbye-like messages
    const goodbyePattern = /\b(bye|goodbye|good bye|see ya|later|cya|peace|gotta go|gtg|ttyl|talk later|farewell|adios|take care|night|goodnight|gn|im out|i'm out)\b/i;
    if (goodbyePattern.test(text)) {
        setTimeout(() => {
            if (!collapsed) toggleChatbox();
        }, 2000);
    }
}

function toggleChatbox() {
    collapsed = !collapsed;
    if (collapsed) {
        chatbox.classList.add('chatbox-collapsed');
        toggle.textContent = '+';
    } else {
        chatbox.classList.remove('chatbox-collapsed');
        toggle.textContent = '\u2212';
        setTimeout(() => input.focus(), 100);
    }
}

// Show chatbox after intro is dismissed
export function showChatbox() {
    if (CONFIG.ui.showAfterIntro) {
        chatbox.style.display = 'block';
    }
}

// Show immediately if not gated behind intro
if (!CONFIG.ui.showAfterIntro) {
    chatbox.style.display = 'block';
}

// Event listeners
header.addEventListener('click', toggleChatbox);
sendBtn.addEventListener('click', handleSend);
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
});

// Prevent clicks on chatbox from propagating to the 3D scene
chatbox.addEventListener('click', (e) => e.stopPropagation());
chatbox.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });
