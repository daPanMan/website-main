// AI Chatbox - driven by chatbot-config.js
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

function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `chat-msg ${sender}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function getPlaceholderResponse() {
    const pool = CONFIG.placeholderResponses;
    return pool[Math.floor(Math.random() * pool.length)];
}

async function getAIResponse(userText) {
    if (!CONFIG.api.enabled || !CONFIG.api.apiKey) {
        return getPlaceholderResponse();
    }

    try {
        if (CONFIG.api.provider === 'openai') {
            const res = await fetch(CONFIG.api.endpoint || 'https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.api.apiKey}`
                },
                body: JSON.stringify({
                    model: CONFIG.api.model,
                    messages: [
                        { role: 'system', content: CONFIG.api.systemPrompt },
                        { role: 'user', content: userText }
                    ],
                    max_tokens: CONFIG.api.maxTokens,
                    temperature: CONFIG.api.temperature
                })
            });
            const data = await res.json();
            if (data.choices && data.choices[0]) {
                return data.choices[0].message.content.trim();
            }
        } else if (CONFIG.api.provider === 'custom' && CONFIG.api.endpoint) {
            const res = await fetch(CONFIG.api.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userText,
                    systemPrompt: CONFIG.api.systemPrompt
                })
            });
            const data = await res.json();
            return data.reply || data.message || data.response || getPlaceholderResponse();
        }
    } catch (err) {
        console.warn('Chatbox API error:', err);
    }

    return getPlaceholderResponse();
}

async function handleSend() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    input.value = '';

    const delay = CONFIG.typing.minDelay + Math.random() * (CONFIG.typing.maxDelay - CONFIG.typing.minDelay);

    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-msg bot typing';
    typingDiv.textContent = '...';
    messages.appendChild(typingDiv);
    messages.scrollTop = messages.scrollHeight;

    const response = await getAIResponse(text);

    setTimeout(() => {
        typingDiv.remove();
        addMessage(response, 'bot');
    }, delay);
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
