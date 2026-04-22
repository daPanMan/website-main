// AI Chatbox - fully AI-driven via Groq API
import CONFIG from './chatbot-config.js';
import { t } from '../i18n.js';

// Pre-compiled once at module load — avoids recompiling the regex on every message send
const GOODBYE_RE = /\b(bye|goodbye|good bye|see ya|later|cya|peace|gotta go|gtg|ttyl|talk later|farewell|adios|take care|night|goodnight|gn|im out|i'm out)\b/i;

const chatbox = document.getElementById('chatbox');
const header = document.getElementById('chatbox-header');
const toggle = document.getElementById('chatbox-toggle');
const messages = document.getElementById('chatbox-messages');
const input = document.getElementById('chatbox-input');
const sendBtn = document.getElementById('chatbox-send');

// Apply config to UI — use live t() calls so the correct language is set at load time
document.getElementById('chatbox-title').textContent = t('chatTitle');
input.placeholder = t('chatPlaceholder');
input.maxLength = 300;
sendBtn.textContent = CONFIG.ui.sendButton;

// Set initial greeting from i18n (not from config which is evaluated once at import)
messages.querySelector('.chat-msg.bot').textContent = t('chatGreeting');

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

// Per-session message cap — limits free-tier API abuse
const MAX_USER_MESSAGES = 25;
let userMessageCount = 0;

// Rate limiting
let lastApiCall = 0;
const MIN_API_INTERVAL = 1500; // 1.5s between calls — enough to avoid 429s without killing UX
let _retrying = false; // prevents infinite retry loops

async function getAIResponse(userText) {
    if (!CONFIG.api.enabled || !CONFIG.api.endpoint) {
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
            // Auto-retry once after a short delay before giving up
            if (!_retrying) {
                _retrying = true;
                await new Promise(r => setTimeout(r, 800));
                _retrying = false;
                conversationHistory.pop(); // remove the user msg added above
                return getAIResponse(userText); // retry
            }
            _retrying = false;
            conversationHistory.pop();
            return { text: "Having a bit of trouble connecting — try again in a sec! 😅", fromAI: false };
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

    // Per-session message cap
    if (userMessageCount >= MAX_USER_MESSAGES) {
        addMessage("You've reached the message limit for this session — refresh the page to start a new chat! 😄", 'bot');
        return;
    }

    addMessage(text, 'user');
    input.value = '';
    userMessageCount++;

    // Show typing indicator with animated dots
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-msg bot typing';
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        dot.textContent = '●';
        dot.style.cssText = `animation: typing-dot 1.2s ease-in-out ${i * 0.2}s infinite; font-size: 10px; opacity: 0.3;`;
        typingDiv.appendChild(dot);
    }
    messages.appendChild(typingDiv);
    messages.scrollTop = messages.scrollHeight;

    // Short typing indicator so the user sees feedback, but don't artificially delay
    const typingDelay = 400 + Math.random() * 400; // 400-800ms — just enough to feel natural

    const [result] = await Promise.all([
        getAIResponse(text),
        new Promise(r => setTimeout(r, typingDelay))
    ]);

    typingDiv.remove();
    addMessage(result.text, 'bot', result.fromAI);

    // Auto-close chatbox on goodbye-like messages
    if (GOODBYE_RE.test(text)) {
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

// Close chatbox when clicking/tapping outside of it
document.addEventListener('click', (e) => {
    if (!collapsed && !chatbox.contains(e.target)) {
        toggleChatbox();
    }
});
document.addEventListener('touchstart', (e) => {
    if (!collapsed && !chatbox.contains(e.target)) {
        toggleChatbox();
    }
}, { passive: true });

// Hot language switch — update chatbox UI strings without a page reload
window.addEventListener('langchange', () => {
    document.getElementById('chatbox-title').textContent = t('chatTitle');
    input.placeholder = t('chatPlaceholder');

    // Swap the greeting bubble if it's still the only message (untouched conversation)
    const allMsgs = messages.querySelectorAll('.chat-msg.bot');
    if (allMsgs.length === 1 && allMsgs[0].textContent === allMsgs[0].textContent) {
        // Only replace if it matches a known greeting (EN or ZH) — don't overwrite real replies
        const enGreeting = "Hey! I'm John. Ask me anything about myself or this site!";
        const zhGreeting = "嘿！我是潘栋。有什么想问我的？";
        const current = allMsgs[0].textContent;
        if (current === enGreeting || current === zhGreeting) {
            allMsgs[0].textContent = t('chatGreeting');
        }
    }
});
