/**
 * ==========================================================================
 * KABEER AI ASSISTANT — BESPOKE LUXURY CHATBOT ENGINE
 * Direct Integration with n8n Webhook:
 * https://kabeerai.tech/webhook/7b620939-ffb2-4f48-9ed8-d241da05081f/chat
 * ==========================================================================
 */

(function () {
  'use strict';

  const WEBHOOK_URL = 'https://kabeerai.tech/webhook/7b620939-ffb2-4f48-9ed8-d241da05081f/chat';
  const STORAGE_SESSION_KEY = 'kth_ai_session_id';
  const STORAGE_HISTORY_KEY = 'kth_ai_history';

  // State
  let sessionId = '';
  let messages = [];
  let isSending = false;
  let isFullscreen = false;
  let ambientBoost = false;

  // DOM Elements
  let triggerBtn, modal, backdrop, windowEl, closeBtn, expandBtn, illumBtn;
  let welcomeView, messagesView, messagesList, typingIndicator;
  let form, input, sendBtn, scrollArea;
  let navNewChat, navProjects, navTools, navSettings, featuredCard;

  document.addEventListener('DOMContentLoaded', initChatAssistant);

  function initChatAssistant() {
    // Cache Elements
    triggerBtn = document.getElementById('kth-chat-trigger');
    modal = document.getElementById('kth-chat-modal');
    backdrop = document.getElementById('kth-chat-backdrop');
    windowEl = document.getElementById('kth-chat-window');
    closeBtn = document.getElementById('kth-btn-close');
    expandBtn = document.getElementById('kth-btn-expand');
    illumBtn = document.getElementById('kth-btn-illumination');

    welcomeView = document.getElementById('kth-welcome-view');
    messagesView = document.getElementById('kth-messages-view');
    messagesList = document.getElementById('kth-messages-list');
    typingIndicator = document.getElementById('kth-typing-indicator');

    form = document.getElementById('kth-chat-form');
    input = document.getElementById('kth-chat-input');
    sendBtn = document.getElementById('kth-btn-send');
    scrollArea = document.getElementById('kth-chat-scrollarea');

    navNewChat = document.getElementById('kth-nav-new-chat');
    navProjects = document.getElementById('kth-nav-projects');
    navTools = document.getElementById('kth-nav-tools');
    navSettings = document.getElementById('kth-nav-settings');
    featuredCard = document.getElementById('kth-featured-card');

    if (!modal || !form || !input) return;

    // Initialize or load session ID
    initSession();

    // Load saved messages from storage
    loadHistory();

    // Event Bindings
    bindEvents();
  }

  function initSession() {
    try {
      sessionId = localStorage.getItem(STORAGE_SESSION_KEY);
      if (!sessionId) {
        sessionId = generateUUID();
        localStorage.setItem(STORAGE_SESSION_KEY, sessionId);
      }
    } catch (e) {
      sessionId = generateUUID();
    }
  }

  function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'kth-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
  }

  function loadHistory() {
    try {
      const saved = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (saved) {
        messages = JSON.parse(saved);
        if (Array.isArray(messages) && messages.length > 0) {
          renderMessages();
          showMessagesView();
        }
      }
    } catch (e) {
      messages = [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(messages));
    } catch (e) {}
  }

  function bindEvents() {
    // Open modal
    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => openModal());
    }

    // Close modal
    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeModal());
    }
    if (backdrop) {
      backdrop.addEventListener('click', () => closeModal());
    }

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('kth-open')) {
        closeModal();
      }
    });

    // Expand / Fullscreen Toggle
    if (expandBtn) {
      expandBtn.addEventListener('click', toggleFullscreen);
    }

    // Illumination / Ambient Glow Toggle
    if (illumBtn) {
      illumBtn.addEventListener('click', toggleIllumination);
    }

    // Navigation Buttons
    if (navNewChat) {
      navNewChat.addEventListener('click', () => {
        resetChat();
      });
    }

    if (navProjects) {
      navProjects.addEventListener('click', () => {
        closeModal();
        const target = document.querySelector('#work') || document.querySelector('#projects');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    if (navTools) {
      navTools.addEventListener('click', () => {
        closeModal();
        const target = document.querySelector('#skills') || document.querySelector('#services');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    if (navSettings) {
      navSettings.addEventListener('click', () => {
        if (confirm('Clear current chat history and restart?')) {
          resetChat();
        }
      });
    }

    // Featured Card click
    if (featuredCard) {
      featuredCard.addEventListener('click', () => {
        input.focus();
      });
    }

    // Quick Suggestions
    const suggestionCards = document.querySelectorAll('.kth-suggestion-card');
    suggestionCards.forEach((card) => {
      card.addEventListener('click', () => {
        const prompt = card.getAttribute('data-prompt');
        if (prompt) {
          handleSendMessage(prompt);
        }
      });
    });

    // Form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (text) {
        handleSendMessage(text);
      }
    });

    // Attachment dummy tooltip
    const attachBtn = document.getElementById('kth-btn-attach');
    if (attachBtn) {
      attachBtn.addEventListener('click', () => {
        input.value = 'I would like to share project requirements: ';
        input.focus();
      });
    }
  }

  function openModal() {
    modal.classList.add('kth-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      input.focus();
      scrollToBottom();
    }, 150);
  }

  function closeModal() {
    modal.classList.remove('kth-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function toggleFullscreen() {
    isFullscreen = !isFullscreen;
    windowEl.classList.toggle('kth-fullscreen', isFullscreen);
    expandBtn.classList.toggle('kth-active', isFullscreen);
  }

  function toggleIllumination() {
    ambientBoost = !ambientBoost;
    windowEl.classList.toggle('kth-ambient-boost', ambientBoost);
    illumBtn.classList.toggle('kth-active', ambientBoost);
  }

  function showMessagesView() {
    welcomeView.style.display = 'none';
    messagesView.style.display = 'block';
  }

  function showWelcomeView() {
    welcomeView.style.display = 'flex';
    messagesView.style.display = 'none';
  }

  function resetChat() {
    messages = [];
    sessionId = generateUUID();
    try {
      localStorage.setItem(STORAGE_SESSION_KEY, sessionId);
      localStorage.removeItem(STORAGE_HISTORY_KEY);
    } catch (e) {}
    messagesList.innerHTML = '';
    showWelcomeView();
    input.value = '';
    input.focus();
  }

  async function handleSendMessage(userText) {
    if (isSending || !userText.trim()) return;

    isSending = true;
    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;

    // Switch view to messages if not already
    showMessagesView();

    // 1. Append User Message
    const userMsg = {
      role: 'user',
      text: userText,
      timestamp: Date.now()
    };
    messages.push(userMsg);
    renderSingleMessage(userMsg);
    saveHistory();
    scrollToBottom();

    // 2. Show Typing Indicator
    showTyping();
    scrollToBottom();

    // 3. Make Request to n8n Webhook
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'sendMessage',
          sessionId: sessionId,
          chatInput: userText
        })
      });

      hideTyping();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let data;
      const rawText = await response.text();
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        data = rawText;
      }

      const botReplyText = extractBotText(data);

      const botMsg = {
        role: 'bot',
        text: botReplyText,
        timestamp: Date.now()
      };
      messages.push(botMsg);
      renderSingleMessage(botMsg);
      saveHistory();
    } catch (error) {
      console.error('Kabeer AI Chat Error:', error);
      hideTyping();

      const errorMsg = {
        role: 'bot',
        text: "I couldn't reach the Kabeer Tech Hub assistant server right now. Please check your connection or contact Kabeer directly through the inquiry form below.",
        timestamp: Date.now(),
        isError: true
      };
      messages.push(errorMsg);
      renderSingleMessage(errorMsg);
      saveHistory();
    } finally {
      isSending = false;
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
      scrollToBottom();
    }
  }

  function extractBotText(res) {
    if (typeof res === 'string') return res;
    let t = res?.output ?? res?.text ?? res?.message ?? '';
    if (typeof t === 'object' && t?.type === 'text') return t.text;
    if (!t && typeof res === 'object') {
      try {
        return JSON.stringify(res, null, 2);
      } catch (e) {}
    }
    return t || 'I received your query. How else may I assist you with AI automation and digital solutions?';
  }

  function renderMessages() {
    messagesList.innerHTML = '';
    messages.forEach((msg) => renderSingleMessage(msg));
    scrollToBottom();
  }

  function renderSingleMessage(msg) {
    const isUser = msg.role === 'user';
    const msgEl = document.createElement('div');
    msgEl.className = `kth-chat-msg ${isUser ? 'kth-msg-user' : 'kth-msg-bot'}`;

    if (!isUser) {
      // Robot Avatar on Left
      const avatarEl = document.createElement('div');
      avatarEl.className = 'kth-msg-avatar';
      avatarEl.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="4" y="8" width="16" height="12" rx="4"></rect>
          <circle cx="9" cy="14" r="1.5" fill="currentColor"></circle>
          <circle cx="15" cy="14" r="1.5" fill="currentColor"></circle>
        </svg>
      `;
      msgEl.appendChild(avatarEl);
    }

    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'kth-msg-bubble';

    if (isUser) {
      bubbleEl.textContent = msg.text;
    } else {
      bubbleEl.innerHTML = parseMarkdown(msg.text);
    }

    msgEl.appendChild(bubbleEl);
    messagesList.appendChild(msgEl);
  }

  function showTyping() {
    typingIndicator.style.display = 'flex';
  }

  function hideTyping() {
    typingIndicator.style.display = 'none';
  }

  function scrollToBottom() {
    setTimeout(() => {
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }, 50);
  }

  // Lightweight safe Markdown Formatter
  function parseMarkdown(text) {
    if (!text) return '';

    // Escape raw HTML tags
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks ```code```
    html = html.replace(/```([\s\S]*?)```/g, (match, p1) => {
      return `<pre class="kth-code-block"><code>${p1.trim()}</code></pre>`;
    });

    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code class="kth-inline-code">$1</code>');

    // Bold **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic *text*
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Links [text](url)
    html = html.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="kth-chat-link">$1</a>'
    );

    // Bullet lists
    const lines = html.split('\n');
    let inList = false;
    let formatted = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (/^[*-]\s+(.+)/.test(trimmed)) {
        if (!inList) {
          formatted.push('<ul class="kth-chat-ul">');
          inList = true;
        }
        formatted.push(`<li>${trimmed.replace(/^[*-]\s+/, '')}</li>`);
      } else {
        if (inList) {
          formatted.push('</ul>');
          inList = false;
        }
        if (trimmed) {
          formatted.push(`<p>${trimmed}</p>`);
        }
      }
    });

    if (inList) formatted.push('</ul>');

    return formatted.join('');
  }
})();
