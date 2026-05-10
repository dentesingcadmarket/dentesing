// ══════════════════════════════════════════
// D·CONSOLE TERMINAL — CAD Analiz Motoru
// ══════════════════════════════════════════
const TERMINAL_STORAGE = 'terminal_history_v1';
let terminalHistory = [];
let terminalLoading = false;
let terminalFileData = null; // {base64, mediaType, name, isStl}

const TERMINAL_SYSTEM = `Sen D·CONSOLE Terminal'sin. Diş teknisyeni eğitimi için geliştirilmiş özel bir CAD analiz motoru. Exocad, 3Shape, zirkonyum, PFM, implant üst yapıları, oklüzyon ve frezleme parametrelerinde üst düzey uzmanlaşmış teknik sistemsin. Yanıtlarını net, teknik ve doğrudan ver. Türkçe konuş, teknik terimleri hem TR hem EN yaz. Asla "bilmiyorum" deme, her zaman en doğru bilgiyi ver veya yönlendir. Sayısal parametre sorusunda kesin değerler belirt.`;

function initTerminal() {
  const saved = localStorage.getItem(TERMINAL_STORAGE);
  if (saved) {
    try { terminalHistory = JSON.parse(saved); } catch(e) { terminalHistory = []; }
  }
  renderTerminalHistory();
  if (typeof initTerminalWave === 'function') {
    initTerminalWave('terminal-wave');
  }
}

function renderTerminalHistory() {
  const chat = document.getElementById('terminal-chat');
  const welcome = document.getElementById('terminal-welcome');
  if (!chat) return;
  if (welcome) welcome.style.display = terminalHistory.length ? 'none' : 'flex';
  Array.from(chat.children).forEach(el => {
    if (el.id !== 'terminal-welcome') el.remove();
  });
  terminalHistory.forEach(msg => {
    addTerminalBubble(msg.content, msg.role === 'user' ? 'user' : 'ai', false);
  });
  chat.scrollTop = chat.scrollHeight;
}

function addTerminalBubble(text, role, scroll = true) {
  const chat = document.getElementById('terminal-chat');
  const welcome = document.getElementById('terminal-welcome');
  if (welcome) welcome.style.display = 'none';

  const wrap = document.createElement('div');
  wrap.className = 'terminal-msg ' + (role === 'user' ? 'user' : 'ai');

  const bubble = document.createElement('div');
  bubble.className = 'terminal-bubble ' + role;

  if (role === 'ai') {
    bubble.innerHTML = formatTerminalText(text);
  } else {
    bubble.textContent = text;
  }

  wrap.appendChild(bubble);
  chat.appendChild(wrap);
  if (scroll) chat.scrollTop = chat.scrollHeight;
  return bubble;
}

function addTerminalTyping() {
  const chat = document.getElementById('terminal-chat');
  const id = 'terminal-typing-' + Date.now();
  const wrap = document.createElement('div');
  wrap.id = id;
  wrap.className = 'terminal-msg ai';
  wrap.innerHTML = `<div class="terminal-bubble ai"><div class="asistan-typing-dots"><span></span><span></span><span></span></div></div>`;
  chat.appendChild(wrap);
  chat.scrollTop = chat.scrollHeight;
  return id;
}

function formatTerminalText(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^#{1,3}\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

function terminalKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTerminalMsg(); }
}

function terminalFileSelected(input) {
  if (!input.files?.[0]) return;
  const file = input.files[0];
  const isStl = file.name.toLowerCase().endsWith('.stl');
  const badge = document.getElementById('terminal-file-badge');

  if (isStl) {
    terminalFileData = { name: file.name, isStl: true, base64: null, mediaType: null };
    if (badge) { badge.textContent = `STL: ${file.name}`; badge.style.display = 'inline-block'; }
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result.split(',')[1];
    const mediaType = file.type || 'image/jpeg';
    terminalFileData = { name: file.name, isStl: false, base64, mediaType };
    if (badge) { badge.textContent = `IMG: ${file.name}`; badge.style.display = 'inline-block'; }
  };
  reader.readAsDataURL(file);
}

async function sendTerminalMsg() {
  if (terminalLoading) return;
  const input = document.getElementById('terminal-input');
  const text = (input?.value || '').trim();
  const hasFile = terminalFileData !== null;
  if (!text && !hasFile) return;

  const displayText = text || (terminalFileData?.isStl
    ? `STL: ${terminalFileData.name}`
    : `IMG: ${terminalFileData.name}`);

  input.value = '';
  if (input.style) input.style.height = 'auto';
  addTerminalBubble(displayText, 'user');

  let userContent;
  if (terminalFileData && !terminalFileData.isStl && terminalFileData.base64) {
    userContent = [
      { type: 'image', source: { type: 'base64', media_type: terminalFileData.mediaType, data: terminalFileData.base64 } },
      { type: 'text', text: text || 'Bu tasarımı analiz et.' }
    ];
  } else if (terminalFileData?.isStl) {
    userContent = text
      ? `[STL: ${terminalFileData.name}]\n\n${text}`
      : `STL dosyası yüklendi: ${terminalFileData.name}. Analiz et.`;
  } else {
    userContent = text;
  }

  terminalHistory.push({ role: 'user', content: userContent });
  terminalFileData = null;
  const badge = document.getElementById('terminal-file-badge');
  if (badge) badge.style.display = 'none';
  const fileInput = document.getElementById('terminal-file');
  if (fileInput) fileInput.value = '';

  terminalLoading = true;
  const typingId = addTerminalTyping();

  try {
    const {data:{session}} = await sb.auth.getSession();
    const messages = terminalHistory.slice(-12).map(m => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : m.content
    }));

    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (session?.access_token || '')
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: TERMINAL_SYSTEM,
        messages
      })
    });

    const data = await res.json();
    document.getElementById(typingId)?.remove();

    if (data.error) {
      addTerminalBubble('HATA: ' + data.error.message, 'ai');
    } else if (data.content?.[0]?.text) {
      const reply = data.content[0].text;
      addTerminalBubble(reply, 'ai');
      terminalHistory.push({ role: 'assistant', content: reply });
      const saveHistory = terminalHistory.map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : (Array.isArray(m.content) ? m.content.find(c=>c.type==='text')?.text || '[görsel]' : '[veri]')
      }));
      localStorage.setItem(TERMINAL_STORAGE, JSON.stringify(saveHistory.slice(-30)));
    } else {
      addTerminalBubble('HATA: Yanıt alınamadı.', 'ai');
    }

  } catch(err) {
    document.getElementById(typingId)?.remove();
    addTerminalBubble('HATA: ' + err.message, 'ai');
  }

  terminalLoading = false;
}

function clearTerminalHistory() {
  terminalHistory = [];
  localStorage.removeItem(TERMINAL_STORAGE);
  const chat = document.getElementById('terminal-chat');
  if (chat) {
    Array.from(chat.children).forEach(el => { if (el.id !== 'terminal-welcome') el.remove(); });
    const welcome = document.getElementById('terminal-welcome');
    if (welcome) welcome.style.display = 'flex';
  }
}

async function askTerminalFromVaka(vakaContext, userNote) {
  const content = `VAKA BİLGİSİ:\n${vakaContext}\n\nTEKNİSYEN DEĞERLENDİRMESİ:\n${userNote || '(Değerlendirme yazılmadı)'}\n\nBu vakayı analiz et. Doğru yaklaşım neydi, ne iyileştirilebilir?`;
  terminalHistory.push({ role: 'user', content });

  const {data:{session}} = await sb.auth.getSession();
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (session?.access_token || '') },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: TERMINAL_SYSTEM,
      messages: terminalHistory.slice(-6)
    })
  });
  const data = await res.json();
  const reply = data.content?.[0]?.text || 'Yanıt alınamadı.';
  terminalHistory.push({ role: 'assistant', content: reply });
  return reply;
}
