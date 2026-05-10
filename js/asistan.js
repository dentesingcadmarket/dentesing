// ==========================================
// TEKNÝK ASÝSTAN
// ==========================================
let asistanHistory = [];
let asistanLoading = false;

function initAsistan() {
  // Sayfaya her gelindiðinde welcome'ý göster (sohbet geçmiþi varsa gizle)
  const welcome = document.getElementById('asistan-welcome');
  if (welcome) welcome.style.display = asistanHistory.length ? 'none' : 'flex';
}

function autoResizeTA(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 140) + 'px';
}

function asistanKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendAsistanMsg();
  }
}

function askSuggestion(text) {
  const input = document.getElementById('asistan-input');
  if (input) { input.value = text; autoResizeTA(input); }
  sendAsistanMsg();
}

function addAsistanBubble(text, role) {
  const chat = document.getElementById('asistan-chat');
  const welcome = document.getElementById('asistan-welcome');
  if (welcome) welcome.style.display = 'none';

  const wrap = document.createElement('div');
  wrap.className = 'asistan-msg ' + role;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.style.display = 'flex';
  avatar.style.alignItems = 'center';
  avatar.style.justifyContent = 'center';
  avatar.innerHTML = role === 'ai'
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(155,109,208,0.85)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,217,0.85)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  if (role === 'ai') {
    bubble.innerHTML = formatAsistanText(text);
  } else {
    bubble.textContent = text;
  }

  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  chat.appendChild(wrap);
  chat.scrollTop = chat.scrollHeight;
  return bubble;
}

function formatAsistanText(text) {
  // Markdown benzeri basit formatlama
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h3>$1</h3>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])/gm, '')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    || text;
}

function addTypingBubble() {
  const chat = document.getElementById('asistan-chat');
  const id = 'typing-' + Date.now();
  const wrap = document.createElement('div');
  wrap.id = id;
  wrap.className = 'asistan-msg ai';
  wrap.innerHTML = `<div class="msg-avatar" style="display:flex;align-items:center;justify-content:center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(155,109,208,0.85)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div><div class="msg-bubble"><div class="asistan-typing-dots"><span></span><span></span><span></span></div></div>`;
  chat.appendChild(wrap);
  chat.scrollTop = chat.scrollHeight;
  return id;
}

async function sendAsistanMsg() {
  if (asistanLoading) return;
  const input = document.getElementById('asistan-input');
  const sendBtn = document.getElementById('asistan-send-btn');
  const text = (input?.value || '').trim();
  if (!text) return;

  // UI temizle
  input.value = '';
  autoResizeTA(input);
  addAsistanBubble(text, 'user');
  asistanHistory.push({ role: 'user', content: text });

  asistanLoading = true;
  if (sendBtn) sendBtn.disabled = true;
  const typingId = addTypingBubble();

  try {
    // Kullanýcý verilerini çek
    let contextBlock = '';
    if (currentUser) {
      const [hataRes, gunlukRes] = await Promise.all([
        sb.from('hata_gunlugu').select('hata,sebep,cozum,tekrarlandi,tarih').eq('user_id', currentUser.id).order('tarih', {ascending:false}).limit(8),
        sb.from('gunluk_takip').select('is_turu,sure,hata_sayisi,zorluk,tarih').eq('user_id', currentUser.id).order('tarih', {ascending:false}).limit(8)
      ]);

      if (hataRes.data?.length) {
        contextBlock += '\n\nKULLANICININ SON HATA KAYITLARI:\n';
        hataRes.data.forEach(h => {
          contextBlock += `- Hata: ${h.hata} | Sebep: ${h.sebep||'—'} | Çözüm: ${h.cozum||'—'} | Tekrar etti mi: ${h.tekrarlandi ? 'EVET (KRÝTÝK)' : 'Hayýr'}\n`;
        });
      }
      if (gunlukRes.data?.length) {
        contextBlock += '\nKULLANICININ SON GÜNLÜK ÝÞ KAYITLARI:\n';
        gunlukRes.data.forEach(g => {
          contextBlock += `- Ýþ türü: ${g.is_turu} | Süre: ${g.sure}dk | Hata sayýsý: ${g.hata_sayisi} | Zorluk: ${g.zorluk}\n`;
        });
      }
    }

    const systemPrompt = `Sen Dentesing CAD Market platformunun teknik asistanýsýn. Diþ teknisyenliði alanýnda üst düzey uzman ve deneyimli bir mentorsun.

UZMANLIK ALANLARIN:
• Sabit protez: Tam zirkonyum, PFM, E-max, hibrit restorasyonlar
• Hareketli protez: Kennedy sýnýflandýrmasý (4 sýnýf + Applegate modifikasyonlarý), tam protez, bölümlü protez, kroþe ve tutturucu tasarýmý, RPI sistemi, hassas tutturucular
• Ýmplant üst yapýlarý: Screw-retained vs cement-retained karar kriterleri, açýlý abutmentlar, all-on-4/6
• CAD/CAM: Exocad (DentalCAD), 3Shape, Cerec — ileri seviye parametreler, freze stratejileri, baðlantý noktasý optimizasyonu, okluzyum tasarýmý
• Materyal bilimi: Zirkonyum (monolitik, katmanlý), PMMA, E-max, hibrit seramik, titanyum — her birinin endikasyon/kontraendikasyon ve teknik parametreleri
• Oklüzyon: artikülatör kullanýmý, maksimum interkuspidasyonu, sentrik iliþki, anterior rehberlik
• Frezleme parametreleri: Wet/dry milling, bur aþýnmasý, toleranslar, yüzey kalitesi

DAVRANIÞ KURALLARI:
• Türkçe yanýt ver
• Doðrudan, teknik ve pratik ol — gereksiz giriþ cümleleri kurma
• Teknik terimleri hem Türkçe hem Ýngilizce yaz (Kennedy Class I / Sýnýf I)
• Kullanýcýnýn hata ve günlük iþ verileri varsa mutlaka dikkate al ve kiþiselleþtir
• Eðer hata geçmiþinden tekrar eden bir sorun görüyorsan proaktif olarak belirt
• Sayýsal parametre sorusunda net deðerler ver (0.5mm, 1200°C gibi)
• Yanýtlarý maddeli, okunmasý kolay formatta ver${contextBlock}`;

    // Anthropic API çaðrýsý
    const messages = asistanHistory.slice(-10); // son 10 mesaj

    const {data:{session:sess}} = await sb.auth.getSession();
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (sess?.access_token || '')
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: systemPrompt,
        messages: messages
      })
    });

    const data = await res.json();

    // Typing kaldýr
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();

    if (data.content?.[0]?.text) {
      const reply = data.content[0].text;
      addAsistanBubble(reply, 'ai');
      asistanHistory.push({ role: 'assistant', content: reply });
    } else if (data.error) {
      addAsistanBubble(`? API Hatasý: ${data.error.message}`, 'ai');
    } else {
      addAsistanBubble('? Yanýt alýnamadý. API anahtarýnýzý kontrol edin.', 'ai');
    }

  } catch(err) {
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();
    addAsistanBubble(`? Baðlantý hatasý: ${err.message}`, 'ai');
    console.error('Asistan hata:', err);
  }

  asistanLoading = false;
  if (sendBtn) sendBtn.disabled = false;
}

