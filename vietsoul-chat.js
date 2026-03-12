/* ═══════════════════════════════════════════════════════════════
   VIETSOUL CHAT ENGINE — v1.0
   Real AI chatbot using Anthropic Claude API
   Replaces the mock 5-step simulation in index.html

   HOW IT WORKS:
   1. Patches window.startChatSimulation + addMessage after DOM ready
   2. Keeps full conversation history per product (window._vsChatHistory)
   3. Calls Claude claude-sonnet-4-20250514 with a rich Vietnamese
      cultural heritage system prompt
   4. Falls back gracefully if API fails
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Config ── */
  const MODEL     = 'claude-sonnet-4-20250514';
  const MAX_TOKENS = 400;    // Giữ câu trả lời ngắn, phù hợp sidebar
  const API_URL   = 'https://api.anthropic.com/v1/messages';

  /* ── Per-product conversation history (role: user|assistant) ── */
  window._vsChatHistory = {};   // { [productId]: [{role, content}] }
  let _currentProduct   = null; // Object sản phẩm đang xem

  /* ── System prompt — chuyên sâu làng nghề Việt Nam ── */
  function buildSystemPrompt(p) {
    const tags   = (p.tags  || []).join(', ') || 'thủ công truyền thống';
    const story  = p.story  || 'Sản phẩm thủ công truyền thống Việt Nam.';
    return `Bạn là VietSoul AI — trợ lý văn hoá chuyên về làng nghề thủ công truyền thống Việt Nam.
Bạn đang tư vấn cho khách hàng về sản phẩm cụ thể này:

▸ Tên sản phẩm : ${p.name}
▸ Danh mục     : ${p.category || 'thủ công mỹ nghệ'}
▸ Nghệ nhân    : ${p.artist}
▸ Vùng sản xuất: ${p.location}
▸ Giá bán      : ${p.price} ₫
▸ Cam kết xanh : ${tags}
▸ Câu chuyện   : ${story}

NHIỆM VỤ CỦA BẠN:
• Kể chuyện di sản sống động — lịch sử làng nghề, kỹ thuật chế tác, ý nghĩa văn hoá
• Tư vấn chân thành: khi nào phù hợp mua, cách bảo quản, ý nghĩa tặng quà
• Giải thích các nhãn Green Tag và cam kết bền vững của nghệ nhân
• Gợi ý cá nhân hoá (màu, kích thước, khắc tên) nếu khách hỏi
• So sánh sản phẩm với các dòng tương tự khi được yêu cầu

PHONG CÁCH TRẢ LỜI:
• Ấm áp, tự nhiên như người hướng dẫn viên du lịch văn hoá am hiểu sâu
• Câu trả lời ngắn gọn: 2–4 câu, dùng emoji văn hoá phù hợp (🏺 🌿 🎨 ✦ 🧵 v.v.)
• Đặt 1 câu hỏi gợi mở ở cuối để tiếp tục cuộc trò chuyện
• Trả lời bằng tiếng Việt, có thể dùng tiếng Anh khi khách hỏi bằng tiếng Anh
• KHÔNG bịa thông tin; nếu không biết thì nói thật và hướng khách tới nghệ nhân

TRÁNH:
• Câu trả lời dài hơn 6 dòng
• Ngôn ngữ marketing sáo rỗng
• Hứa hẹn thông tin vận chuyển hoặc tồn kho cụ thể (đây là demo)`;
  }

  /* ── UI helpers ── */
  function getChatWindow() {
    return document.getElementById('product-chat-window');
  }

  function appendBubble(role, html, isTyping) {
    const win = getChatWindow();
    if (!win) return null;

    const wrap = document.createElement('div');
    wrap.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start items-start space-x-2'} mb-3`;

    if (role === 'user') {
      wrap.innerHTML = `<div class="p-3 chat-bubble-user rounded-xl shadow-sm text-[11px] font-medium">${html}</div>`;
    } else {
      wrap.innerHTML = `
        <div class="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[8px] text-white font-bold flex-shrink-0" style="margin-top:2px;">AI</div>
        <div class="p-3 chat-bubble-ai rounded-xl shadow-sm text-[11px] leading-relaxed" id="${isTyping ? 'vs-typing-bubble' : ''}">
          ${isTyping ? _typingHTML() : `<b style="color:var(--color-primary);">VietSoul AI:</b> ${html}`}
        </div>`;
    }

    win.appendChild(wrap);
    win.scrollTop = win.scrollHeight;
    return wrap;
  }

  function _typingHTML() {
    return `<span style="display:inline-flex;gap:3px;align-items:center;padding:2px 0;">
      <span style="width:5px;height:5px;background:var(--color-primary);border-radius:50%;opacity:.6;animation:vs-dot 1s infinite 0s;"></span>
      <span style="width:5px;height:5px;background:var(--color-primary);border-radius:50%;opacity:.6;animation:vs-dot 1s infinite .18s;"></span>
      <span style="width:5px;height:5px;background:var(--color-primary);border-radius:50%;opacity:.6;animation:vs-dot 1s infinite .36s;"></span>
    </span>`;
  }

  function injectTypingCSS() {
    if (document.getElementById('vs-chat-style')) return;
    const s = document.createElement('style');
    s.id = 'vs-chat-style';
    s.textContent = `
      @keyframes vs-dot {
        0%,80%,100% { transform:scale(.6); opacity:.3; }
        40%          { transform:scale(1);  opacity:1;  }
      }
      .vs-chat-suggestion {
        display: inline-block;
        margin: 3px 3px 0 0;
        padding: 4px 10px;
        border-radius: 99px;
        border: 1.5px solid rgba(139,0,0,0.2);
        font-size: 9.5px; font-weight: 700;
        color: #8B0000; cursor: pointer;
        background: rgba(139,0,0,0.03);
        transition: all .15s;
      }
      .vs-chat-suggestion:hover {
        background: #8B0000; color: white; border-color: #8B0000;
      }
      #vs-chat-suggestions {
        padding: 6px 0 2px;
        display: flex; flex-wrap: wrap;
      }
    `;
    document.head.appendChild(s);
  }

  /* ── Suggestion chips shown after first AI message ── */
  function showSuggestions(p) {
    const win = getChatWindow();
    if (!win || document.getElementById('vs-chat-suggestions')) return;

    const suggestions = [
      `Quy trình làm ${p.category === 'gom' ? 'gốm' : p.category === 'tranh' ? 'tranh' : 'sản phẩm'} này?`,
      'Ý nghĩa văn hoá là gì?',
      'Cách bảo quản đúng cách?',
      'Phù hợp làm quà tặng không?',
      'Có thể đặt riêng không?',
    ];

    const wrap = document.createElement('div');
    wrap.id = 'vs-chat-suggestions';
    wrap.className = 'px-1';
    wrap.innerHTML = suggestions.map(s =>
      `<button class="vs-chat-suggestion" onclick="window._vsSendSuggestion(this)">${s}</button>`
    ).join('');
    win.appendChild(wrap);
    win.scrollTop = win.scrollHeight;
  }

  window._vsSendSuggestion = function(btn) {
    const text = btn.textContent;
    // Remove suggestion bar
    const bar = document.getElementById('vs-chat-suggestions');
    if (bar) bar.remove();
    // Send as user message
    sendMessage(text);
  };

  /* ── Set input state ── */
  function setInputState(enabled) {
    const input = document.getElementById('product-chat-input');
    const btn   = document.getElementById('product-send-btn');
    if (input) {
      input.disabled = !enabled;
      input.placeholder = enabled ? 'Hỏi về sản phẩm này...' : 'VietSoul AI đang trả lời...';
      if (enabled) setTimeout(() => input.focus(), 100);
    }
    if (btn) btn.disabled = !enabled;
  }

  /* ── Core: call Anthropic API ── */
  async function askClaude(p, userMessage) {
    const pid     = p.id;
    const history = window._vsChatHistory[pid] || [];

    // Add user turn
    history.push({ role: 'user', content: userMessage });
    window._vsChatHistory[pid] = history;

    // Show typing indicator
    const typingWrap = appendBubble('ai', '', true);
    setInputState(false);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: buildSystemPrompt(p),
          messages: history,
        }),
      });

      // Remove typing bubble
      if (typingWrap) typingWrap.remove();

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status}`);
      }

      const data  = await res.json();
      const reply = (data.content || []).find(b => b.type === 'text')?.text || '';

      if (!reply) throw new Error('Empty response');

      // Add assistant turn to history
      history.push({ role: 'assistant', content: reply });

      // Render — convert **bold** and newlines to HTML
      const html = reply
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p style="margin-top:6px;">')
        .replace(/\n/g, '<br>');

      appendBubble('ai', html);
      setInputState(true);

    } catch (err) {
      if (typingWrap) typingWrap.remove();
      console.error('[VietSoul Chat]', err);

      // Graceful fallback
      const fallbacks = [
        `Xin lỗi, kết nối gặp sự cố nhỏ 🙏 Bạn có thể thử hỏi lại câu khác về <b>${p.name}</b> không?`,
        `Tôi tạm thời không trả lời được câu này. Hãy thử hỏi về quy trình chế tác hoặc ý nghĩa văn hoá của sản phẩm nhé!`,
      ];
      appendBubble('ai', fallbacks[Math.floor(Math.random() * fallbacks.length)]);
      setInputState(true);
    }
  }

  /* ── Send message (used by button + Enter + suggestions) ── */
  function sendMessage(text) {
    const p = _currentProduct;
    if (!p || !text.trim()) return;

    appendBubble('user', escapeHTML(text));
    askClaude(p, text);
  }

  function escapeHTML(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ── Opening greeting when product detail opens ── */
  async function greetProduct(p) {
    _currentProduct = p;

    // Reset conversation for this product
    window._vsChatHistory[p.id] = [];

    // Clear window
    const win = getChatWindow();
    if (win) win.innerHTML = '';

    setInputState(false);

    // Remove old suggestion bar if any
    const oldBar = document.getElementById('vs-chat-suggestions');
    if (oldBar) oldBar.remove();

    // Show typing briefly then greeting
    const typingWrap = appendBubble('ai', '', true);

    // Build rich greeting from product data
    const catGreet = {
      tranh:   `Tranh dân gian <b>${p.name}</b> mang theo cả một dòng lịch sử nghệ thuật dân tộc.`,
      lua:     `Mỗi sợi tơ trong <b>${p.name}</b> được dệt bởi đôi tay tài hoa của nghệ nhân <b>${p.artist}</b>.`,
      gom:     `Bình gốm <b>${p.name}</b> từ làng nghề <b>${p.location}</b> — nơi đất và lửa hội tụ thành nghệ thuật.`,
      dotuong: `Tượng <b>${p.name}</b> được chạm khắc tỉ mỉ bởi <b>${p.artist}</b>, gửi gắm tâm linh người Việt.`,
      gift:    `<b>${p.name}</b> — món quà mang hồn Việt, được làm thủ công tại <b>${p.location}</b>.`,
      default: `Chào bạn! Tôi có thể kể mọi điều về <b>${p.name}</b> — từ lịch sử, kỹ thuật đến ý nghĩa văn hoá.`,
    };
    const greeting = catGreet[p.category] || catGreet.default;

    // Simulate short thinking delay
    await new Promise(r => setTimeout(r, 900));
    if (typingWrap) typingWrap.remove();

    const openingHTML = `<b style="color:var(--color-primary);">VietSoul AI:</b> ✦ ${greeting} Bạn muốn khám phá điều gì về sản phẩm này?`;
    appendBubble('ai', openingHTML);

    // Add to history as first assistant turn
    window._vsChatHistory[p.id] = [{
      role: 'assistant',
      content: `✦ ${greeting.replace(/<[^>]+>/g,'')} Bạn muốn khám phá điều gì về sản phẩm này?`
    }];

    showSuggestions(p);
    setInputState(true);
  }

  /* ── Wire up button + Enter ── */
  function wireInputs() {
    const btn   = document.getElementById('product-send-btn');
    const input = document.getElementById('product-chat-input');
    if (!btn || !input) return;

    // Replace original onclick to avoid conflicts
    btn.onclick = null;
    btn.addEventListener('click', () => {
      const val = input.value.trim();
      if (!val || input.disabled) return;
      input.value = '';
      sendMessage(val);
    });

    input.onkeypress = null;
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        btn.click();
      }
    });
  }

  /* ── Patch window.openProductDetail to intercept & start chat ── */
  function patchOpenProductDetail() {
    if (typeof window.openProductDetail !== 'function') {
      setTimeout(patchOpenProductDetail, 150); return;
    }

    // Guard: already patched by vietsoul-enhancements.js?
    // That patch calls orig(id) then runs setTimeout(120ms) for story/reviews
    // We patch AFTER that by overriding startChatSimulation instead
    // so we don't double-wrap openProductDetail

    // Override startChatSimulation — called from openProductDetail with 500ms delay
    window.startChatSimulation = function(id) {
      const p = (window.allProductsRef || []).find(x => x.id === id);
      if (!p) return;
      greetProduct(p);
    };

    // Also patch currentProductChatId tracking so our sendMessage uses correct product
    // We track _currentProduct ourselves via greetProduct()
  }

  /* ── Init ── */
  function init() {
    injectTypingCSS();
    wireInputs();
    patchOpenProductDetail();
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);

})();