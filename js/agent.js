// ══════════════════════════════════════════
// AI AGENT — YOL HARİTASI MOTORU
// ══════════════════════════════════════════

// Agent state
let agentState = {
  step: 0,
  answers: {},
  done: false
};

// Soru akışı
const agentFlow = [
  {
    key: 'deneyim',
    question: 'Diş teknisyeni olarak kaç yıldır çalışıyorsun?',
    quick: ['Yeni başladım (0-1 yıl)', '1-3 yıl', '3-5 yıl', '5+ yıl']
  },
  {
    key: 'yazilim',
    question: 'Hangi CAD yazılımını kullanıyorsun veya öğrenmek istiyorsun?',
    quick: ['Exocad', '3Shape', 'Her ikisi', 'Henüz bilmiyorum']
  },
  {
    key: 'hedef',
    question: 'En büyük hedefin ne?',
    quick: ['Daha hızlı çalışmak', 'Hata oranını düşürmek', 'Freelance başlamak', 'Kendi işletmemi kurmak']
  },
  {
    key: 'zorluk',
    question: 'Şu an en çok nerede zorlanıyorsun?',
    quick: ['Vaka süreleri', 'Tekrar eden hatalar', 'Müşteri bulmak', 'Fiyatlandırma']
  },
  {
    key: 'sure',
    question: 'Sisteme günde kaç dakika ayırabilirsin?',
    quick: ['5-10 dakika', '15-20 dakika', '30+ dakika']
  }
];

function initAgent() {
  const saved = localStorage.getItem('agent_state_' + (currentUser?.id||''));
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.done) {
      agentState = parsed;
      showRoadmap(parsed.roadmap);
      return;
    }
  }
  agentState = { step: 0, answers: {}, done: false };
  showQuickBtns(agentFlow[0].quick);
}

function showQuickBtns(options) {
  const container = document.getElementById('agent-quick-btns');
  if (!container || !options) { container.innerHTML = ''; return; }
  container.innerHTML = options.map(function(opt) {
    const safe = opt.replace(/"/g, '&quot;');
    return '<button class="agent-qbtn" onclick="selectQuickAnswer(this)" data-val="' + safe + '">' + opt + '</button>';
  }).join('');
}

function selectQuickAnswer(el) {
  const val = typeof el === 'string' ? el : el.dataset ? el.dataset.val : el;
  document.getElementById('agent-input').value = val;
  sendAgentMessage();
}

async function sendAgentMessage() {
  const input = document.getElementById('agent-input');
  const val = input.value.trim();
  if (!val) return;
  input.value = '';

  // Kullanıcı mesajını ekle
  addAgentMsg(val, 'user');
  document.getElementById('agent-quick-btns').innerHTML = '';

  const flow = agentFlow[agentState.step];
  agentState.answers[flow.key] = val;
  agentState.step++;

  // Typing animasyonu
  const typingId = addTypingMsg();

  await new Promise(r => setTimeout(r, 800));
  removeTypingMsg(typingId);

  if (agentState.step < agentFlow.length) {
    const next = agentFlow[agentState.step];
    addAgentMsg(next.question, 'ai');
    showQuickBtns(next.quick);
  } else {
    // Tüm sorular bitti - yol haritası üret
    addAgentMsg('Harika! Sana özel yol haritanı oluşturuyorum...', 'ai');
    await new Promise(r => setTimeout(r, 600));
    const typingId2 = addTypingMsg();
    const roadmap = await generateRoadmap(agentState.answers);
    await new Promise(r => setTimeout(r, 1200));
    removeTypingMsg(typingId2);
    addAgentMsg('Yol haritanız hazır! Aşağıda görebilirsiniz.', 'ai');
    agentState.done = true;
    agentState.roadmap = roadmap;
    localStorage.setItem('agent_state_' + (currentUser?.id||''), JSON.stringify(agentState));
    showRoadmap(roadmap);
    document.getElementById('agent-input-row').style.display = 'none';
  }
}

async function generateRoadmap(answers) {
  // Proxy üzerinden AI ile yol haritası üret
  try {
    const prompt = `Sen bir diş teknisyeni kariyer koçusun. Kullanıcı bilgileri:
- Deneyim: ${answers.deneyim}
- Yazılım: ${answers.yazilim}
- Hedef: ${answers.hedef}
- Zorluk: ${answers.zorluk}
- Günlük süre: ${answers.sure}

Bu kullanıcıya özel 5 adımlı kişisel gelişim yol haritası oluştur.
JSON formatında yanıt ver, başka hiçbir şey yazma:
{
  "steps": [
    {"title": "...", "desc": "...", "week": "Hafta 1-2", "color": "#4a90d9"},
    ...
  ]
}`;

    const {data:{session:agSess}} = await sb.auth.getSession();
    const res = await fetch(PROXY_URL, {
      method:'POST',
      headers: {'Content-Type':'application/json','Authorization':'Bearer '+(agSess?.access_token||'')},
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    const text = data.content[0].text.replace(/```json|```/g,'').trim();
    return JSON.parse(text).steps;
  } catch(e) {
    console.log('API hatası, offline mod:', e);
  }

  // Offline — kural bazlı yol haritası
  const isYeni = answers.deneyim?.includes('Yeni') || answers.deneyim?.includes('0-1');
  const hedef = answers.hedef || '';
  const zorluk = answers.zorluk || '';

  const steps = [];

  if (isYeni) {
    steps.push({
      title: 'Temel Protokolleri Otur',
      desc: 'Her iş için standart akış oluştur. Zirkonyum, PFM, implant — her biri için adım adım protokol yaz. Günlük takip sistemiyle tüm vakaları kaydet.',
      week: 'Hafta 1-4',
      color: 'var(--m1b)'
    });
  } else {
    steps.push({
      title: 'Mevcut Hataları Tespit Et',
      desc: 'Son 1 ayın tekrar eden hatalarını listele. Hata günlüğüne gir, radar sistemi sana en kritik olanları gösterecek.',
      week: 'Hafta 1-2',
      color: 'var(--m1b)'
    });
  }

  if (zorluk.includes('süre') || zorluk.includes('hızlı')) {
    steps.push({
      title: 'Hız Analizi Yap',
      desc: 'Hangi iş türünde yavaşsın? Hız analizi modülüne git, hedef süre vs gerçek süre farkına bak. Hedefini %10 azalt.',
      week: 'Hafta 2-4',
      color: 'var(--m2b)'
    });
  } else {
    steps.push({
      title: 'Karar Protokollerini Öğren',
      desc: 'Her vaka tipi için standart karar ağacı oluştur. Estetik mi fonksiyon mu? Sistem sana materyal ve kalınlık önerir.',
      week: 'Hafta 2-3',
      color: 'var(--m2b)'
    });
  }

  steps.push({
    title: 'Dijital Tasarım Temelleri',
    desc: 'CAD yazılımında protokol bazlı çalış. Her iş türü için şablon oluştur, tekrar eden adımları otomatikleştir.',
    week: 'Hafta 4-8',
    color: 'var(--m2b)'
  });

  if (hedef.includes('Freelance') || hedef.includes('işletme')) {
    steps.push({
      title: 'Freelance Altyapı Kur',
      desc: 'Fiyatlandırma sistemini oluştur. İlk 3 müşterini nasıl bulacağını planla. Portföy hazırla.',
      week: 'Hafta 8-12',
      color: 'var(--m3b)'
    });
    steps.push({
      title: 'İlk Müşteriyi Al',
      desc: 'Dental klinik ağını harekete geçir. Sosyal medya profilini optimize et. Referans sistemi kur.',
      week: 'Hafta 10-16',
      color: 'var(--m3b)'
    });
  } else {
    steps.push({
      title: 'Ustanın Radarına Gir',
      desc: 'Hatasız gün sayını artır, skor sisteminde Güvenilir seviyesine ulaş. Üstlerine proaktif rapor ver.',
      week: 'Hafta 8-12',
      color: 'var(--m3b)'
    });
    steps.push({
      title: 'Uzmanlık Alanı Seç',
      desc: 'Full arch, estetik veneer veya implant — bir alanda derinleş. O alanda ilde referans teknisyen ol.',
      week: 'Hafta 12-20',
      color: 'var(--m3b)'
    });
  }

  return steps;
}

function showRoadmap(steps) {
  if (!steps) return;
  const section = document.getElementById('roadmap-section');
  const content = document.getElementById('roadmap-content');
  if (!section || !content) return;

  content.innerHTML = '<div class="db-wrap" style="padding:8px 16px">' +
    steps.map((s,i) => 
      '<div class="roadmap-step">' +
        '<div class="roadmap-num" style="background:' + s.color + '22;color:' + s.color + ';border:1px solid ' + s.color + '44">' + (i+1) + '</div>' +
        '<div><div class="roadmap-title">' + s.title + '</div>' +
        '<div class="roadmap-desc">' + s.desc + '</div>' +
        '<div class="roadmap-week">' + s.week + '</div></div>' +
      '</div>'
    ).join('') +
  '</div>';

  section.style.display = 'block';
  // Agent kartını küçült
  document.getElementById('agent-messages').style.maxHeight = '160px';
}

function addAgentMsg(text, type) {
  const container = document.getElementById('agent-messages');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'agent-msg ' + type;
  div.innerHTML = '<span>' + text + '</span>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function addTypingMsg() {
  const container = document.getElementById('agent-messages');
  if (!container) return null;
  const id = 'typing-' + Date.now();
  const div = document.createElement('div');
  div.id = id;
  div.className = 'agent-msg ai typing';
  div.innerHTML = '<span><div class="agent-typing-dots"><span></span><span></span><span></span></div></span>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeTypingMsg(id) {
  if (!id) return;
  const el = document.getElementById(id);
  if (el) el.remove();
}

function resetAgent() {
  localStorage.removeItem('agent_state_' + (currentUser?.id||''));
  agentState = { step: 0, answers: {}, done: false };
  const messages = document.getElementById('agent-messages');
  if (messages) messages.innerHTML = '<div class="agent-msg ai"><span>Merhaba! Yol haritanı yenilemek için birkaç soru sormam lazım. Hazır mısın?</span></div>';
  const inputRow = document.getElementById('agent-input-row');
  if (inputRow) inputRow.style.display = 'flex';
  document.getElementById('roadmap-section').style.display = 'none';
  showQuickBtns(agentFlow[0].quick);
}
