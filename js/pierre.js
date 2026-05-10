// ══════════════════════════════════════════
// PIERRE FACHUARD — Teknik Asistan Modül 2
// ══════════════════════════════════════════
const PIERRE_STORAGE = 'pierre_history_v1';
let pierreHistory = [];
let pierreLoading = false;
let pierreFileData = null; // {base64, mediaType, name, isStl}

const PIERRE_SYSTEM = `Sen Pierre Fachuard'sın. 25 yıllık deneyimli bir diş teknisyeni ustası ve akademisyensin. Exocad ve 3Shape yazılımlarında uzmansın. Diş morfolojisi, oklüzyon, zirkonyum, PFM, implant üst yapı, tam ark tasarım konularında derin bilgin var. Türkçe konuş. Teknik terimleri doğru kullan. Öğretici, sabırlı ve net ol. Asla "bilmiyorum" deme, her zaman en iyi bilgini paylaş veya yönlendir.`;

function initPierre() {
  const saved = localStorage.getItem(PIERRE_STORAGE);
  if (saved) {
    try { pierreHistory = JSON.parse(saved); } catch(e) { pierreHistory = []; }
  }
  renderPierreHistory();
}

function renderPierreHistory() {
  const chat = document.getElementById('pierre-chat');
  const welcome = document.getElementById('pierre-welcome');
  if (!chat) return;
  if (welcome) welcome.style.display = pierreHistory.length ? 'none' : 'flex';
  Array.from(chat.children).forEach(el => {
    if (el.id !== 'pierre-welcome') el.remove();
  });
  pierreHistory.forEach(msg => {
    addPierreBubble(msg.content, msg.role === 'user' ? 'user' : 'ai', false);
  });
  chat.scrollTop = chat.scrollHeight;
}

function addPierreBubble(text, role, scroll = true) {
  const chat = document.getElementById('pierre-chat');
  const welcome = document.getElementById('pierre-welcome');
  if (welcome) welcome.style.display = 'none';

  const wrap = document.createElement('div');
  wrap.className = 'asistan-msg ' + (role === 'user' ? 'user' : 'ai');

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.style.cssText = 'display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800';
  avatar.innerHTML = role === 'user'
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,217,0.85)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
    : `<span style="background:linear-gradient(135deg,#8a6000,#9b6dd0);width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:800">PF</span>`;

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  if (role === 'ai') bubble.innerHTML = formatAsistanText(text);
  else bubble.textContent = text;

  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  chat.appendChild(wrap);
  if (scroll) chat.scrollTop = chat.scrollHeight;
  return bubble;
}

function addPierreTyping() {
  const chat = document.getElementById('pierre-chat');
  const id = 'pierre-typing-' + Date.now();
  const wrap = document.createElement('div');
  wrap.id = id;
  wrap.className = 'asistan-msg ai';
  wrap.innerHTML = `<span style="background:linear-gradient(135deg,#8a6000,#9b6dd0);width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:800;flex-shrink:0">PF</span><div class="msg-bubble"><div class="asistan-typing-dots"><span></span><span></span><span></span></div></div>`;
  chat.appendChild(wrap);
  chat.scrollTop = chat.scrollHeight;
  return id;
}

function pierreKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendPierreMsg(); }
}

function pierreFileSelected(input) {
  if (!input.files?.[0]) return;
  const file = input.files[0];
  const isStl = file.name.toLowerCase().endsWith('.stl');
  const badge = document.getElementById('pierre-file-badge');

  if (isStl) {
    pierreFileData = { name: file.name, isStl: true, base64: null, mediaType: null };
    if (badge) { badge.textContent = `📦 STL: ${file.name}`; badge.style.display = 'block'; }
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result.split(',')[1];
    const mediaType = file.type || 'image/jpeg';
    pierreFileData = { name: file.name, isStl: false, base64, mediaType };
    if (badge) { badge.textContent = `🖼 Görsel: ${file.name}`; badge.style.display = 'block'; }
  };
  reader.readAsDataURL(file);
}

async function sendPierreMsg() {
  if (pierreLoading) return;
  const input = document.getElementById('pierre-input');
  const text = (input?.value || '').trim();
  const hasFile = pierreFileData !== null;
  if (!text && !hasFile) return;

  const displayText = text || (pierreFileData?.isStl ? `📦 STL dosyası yüklendi: ${pierreFileData.name}` : `🖼 Görsel yüklendi: ${pierreFileData.name}`);

  input.value = '';
  if (input.style) input.style.height = 'auto';
  addPierreBubble(displayText, 'user');

  let userContent;
  if (pierreFileData && !pierreFileData.isStl && pierreFileData.base64) {
    userContent = [
      { type: 'image', source: { type: 'base64', media_type: pierreFileData.mediaType, data: pierreFileData.base64 } },
      { type: 'text', text: text || 'Bu tasarımı değerlendirir misin?' }
    ];
  } else if (pierreFileData?.isStl) {
    userContent = text
      ? `[STL Dosyası: ${pierreFileData.name}]\n\n${text}`
      : `STL dosyası yükledim: ${pierreFileData.name}. Bu konuda ne söylersin?`;
  } else {
    userContent = text;
  }

  pierreHistory.push({ role: 'user', content: userContent });
  pierreFileData = null;
  const badge = document.getElementById('pierre-file-badge');
  if (badge) badge.style.display = 'none';
  const fileInput = document.getElementById('pierre-file');
  if (fileInput) fileInput.value = '';

  pierreLoading = true;
  const typingId = addPierreTyping();

  try {
    const {data:{session}} = await sb.auth.getSession();
    const messages = pierreHistory.slice(-12).map(m => ({
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
        system: PIERRE_SYSTEM,
        messages
      })
    });

    const data = await res.json();
    document.getElementById(typingId)?.remove();

    if (data.error) {
      addPierreBubble('❌ API Hatası: ' + data.error.message, 'ai');
    } else if (data.content?.[0]?.text) {
      const reply = data.content[0].text;
      addPierreBubble(reply, 'ai');
      pierreHistory.push({ role: 'assistant', content: reply });
      const saveHistory = pierreHistory.map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : (Array.isArray(m.content) ? m.content.find(c=>c.type==='text')?.text || '[görsel]' : '[veri]')
      }));
      localStorage.setItem(PIERRE_STORAGE, JSON.stringify(saveHistory.slice(-30)));
    } else {
      addPierreBubble('❌ Yanıt alınamadı. Lütfen tekrar deneyin.', 'ai');
    }

  } catch(err) {
    document.getElementById(typingId)?.remove();
    addPierreBubble('❌ Bağlantı hatası: ' + err.message, 'ai');
  }

  pierreLoading = false;
}

function clearPierreHistory() {
  pierreHistory = [];
  localStorage.removeItem(PIERRE_STORAGE);
  const chat = document.getElementById('pierre-chat');
  if (chat) {
    Array.from(chat.children).forEach(el => { if (el.id !== 'pierre-welcome') el.remove(); });
    const welcome = document.getElementById('pierre-welcome');
    if (welcome) welcome.style.display = 'flex';
  }
}

async function askPierreFromVaka(vakaContext, userNote) {
  const content = `VAKA BİLGİSİ:\n${vakaContext}\n\nTEKNİSYENİN DEĞERLENDİRMESİ:\n${userNote || '(Değerlendirme yazılmadı)'}\n\nBu vaka için değerlendirmemi inceler misin? Doğru yaklaşım neydi, neyi daha iyi yapabilirdim?`;
  pierreHistory.push({ role: 'user', content });

  const {data:{session}} = await sb.auth.getSession();
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (session?.access_token || '') },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: PIERRE_SYSTEM,
      messages: pierreHistory.slice(-6)
    })
  });
  const data = await res.json();
  const reply = data.content?.[0]?.text || 'Yanıt alınamadı.';
  pierreHistory.push({ role: 'assistant', content: reply });
  return reply;
}
