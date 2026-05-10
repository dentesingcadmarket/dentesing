// ==========================================
// AI AGENT � YOL HAR�TASI MOTORU
// ==========================================

// Agent state
let agentState = {
  step: 0,
  answers: {},
  done: false
};

// Soru ak���
const agentFlow = [
  {
    key: 'deneyim',
    question: 'Di� teknisyeni olarak ka� y�ld�r �al���yorsun?',
    quick: ['Yeni ba�lad�m (0-1 y�l)', '1-3 y�l', '3-5 y�l', '5+ y�l']
  },
  {
    key: 'yazilim',
    question: 'Hangi CAD yaz�l�m�n� kullan�yorsun veya ��renmek istiyorsun?',
    quick: ['Exocad', '3Shape', 'Her ikisi', 'Hen�z bilmiyorum']
  },
  {
    key: 'hedef',
    question: 'En b�y�k hedefin ne?',
    quick: ['Daha h�zl� �al��mak', 'Hata oran�n� d���rmek', 'Freelance ba�lamak', 'Kendi i�letmemi kurmak']
  },
  {
    key: 'zorluk',
    question: '�u an en �ok nerede zorlan�yorsun?',
    quick: ['Vaka s�releri', 'Tekrar eden hatalar', 'M��teri bulmak', 'Fiyatland�rma']
  },
  {
    key: 'sure',
    question: 'Sisteme g�nde ka� dakika ay�rabilirsin?',
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

  // Kullan�c� mesaj�n� ekle
  addAgentMsg(val, 'user');
  document.getElementById('agent-quick-btns').innerHTML = '';

  const flow = agentFlow[agentState.step];
  if (!flow) return;
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
    // T�m sorular bitti - yol haritas� �ret
    addAgentMsg('Harika! Sana �zel yol haritan� olu�turuyorum...', 'ai');
    await new Promise(r => setTimeout(r, 600));
    const typingId2 = addTypingMsg();
    const roadmap = await generateRoadmap(agentState.answers);
    await new Promise(r => setTimeout(r, 1200));
    removeTypingMsg(typingId2);
    addAgentMsg('Yol haritan�z haz�r! A�a��da g�rebilirsiniz.', 'ai');
    agentState.done = true;
    agentState.roadmap = roadmap;
    localStorage.setItem('agent_state_' + (currentUser?.id||''), JSON.stringify(agentState));
    showRoadmap(roadmap);
    document.getElementById('agent-input-row').style.display = 'none';
  }
}

async function generateRoadmap(answers) {
  // Proxy �zerinden AI ile yol haritas� �ret
  try {
    const prompt = `Sen bir di� teknisyeni kariyer ko�usun. Kullan�c� bilgileri:
- Deneyim: ${answers.deneyim}
- Yaz�l�m: ${answers.yazilim}
- Hedef: ${answers.hedef}
- Zorluk: ${answers.zorluk}
- G�nl�k s�re: ${answers.sure}

Bu kullan�c�ya �zel 5 ad�ml� ki�isel geli�im yol haritas� olu�tur.
JSON format�nda yan�t ver, ba�ka hi�bir �ey yazma:
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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    const text = data.content[0].text.replace(/```json|```/g,'').trim();
    return JSON.parse(text).steps;
  } catch(e) {
    console.log('API hatas�, offline mod:', e);
  }

  // Offline � kural bazl� yol haritas�
  const isYeni = answers.deneyim?.includes('Yeni') || answers.deneyim?.includes('0-1');
  const hedef = answers.hedef || '';
  const zorluk = answers.zorluk || '';

  const steps = [];

  if (isYeni) {
    steps.push({
      title: 'Temel Protokolleri Otur',
      desc: 'Her i� i�in standart ak�� olu�tur. Zirkonyum, PFM, implant � her biri i�in ad�m ad�m protokol yaz. G�nl�k takip sistemiyle t�m vakalar� kaydet.',
      week: 'Hafta 1-4',
      color: 'var(--m1b)'
    });
  } else {
    steps.push({
      title: 'Mevcut Hatalar� Tespit Et',
      desc: 'Son 1 ay�n tekrar eden hatalar�n� listele. Hata g�nl���ne gir, radar sistemi sana en kritik olanlar� g�sterecek.',
      week: 'Hafta 1-2',
      color: 'var(--m1b)'
    });
  }

  if (zorluk.includes('s�re') || zorluk.includes('h�zl�')) {
    steps.push({
      title: 'H�z Analizi Yap',
      desc: 'Hangi i� t�r�nde yava�s�n? H�z analizi mod�l�ne git, hedef s�re vs ger�ek s�re fark�na bak. Hedefini %10 azalt.',
      week: 'Hafta 2-4',
      color: 'var(--m2b)'
    });
  } else {
    steps.push({
      title: 'Karar Protokollerini ��ren',
      desc: 'Her vaka tipi i�in standart karar a�ac� olu�tur. Estetik mi fonksiyon mu? Sistem sana materyal ve kal�nl�k �nerir.',
      week: 'Hafta 2-3',
      color: 'var(--m2b)'
    });
  }

  steps.push({
    title: 'Dijital Tasar�m Temelleri',
    desc: 'CAD yaz�l�m�nda protokol bazl� �al��. Her i� t�r� i�in �ablon olu�tur, tekrar eden ad�mlar� otomatikle�tir.',
    week: 'Hafta 4-8',
    color: 'var(--m2b)'
  });

  if (hedef.includes('Freelance') || hedef.includes('i�letme')) {
    steps.push({
      title: 'Freelance Altyap� Kur',
      desc: 'Fiyatland�rma sistemini olu�tur. �lk 3 m��terini nas�l bulaca��n� planla. Portf�y haz�rla.',
      week: 'Hafta 8-12',
      color: 'var(--m3b)'
    });
    steps.push({
      title: '�lk M��teriyi Al',
      desc: 'Dental klinik a��n� harekete ge�ir. Sosyal medya profilini optimize et. Referans sistemi kur.',
      week: 'Hafta 10-16',
      color: 'var(--m3b)'
    });
  } else {
    steps.push({
      title: 'Ustan�n Radar�na Gir',
      desc: 'Hatas�z g�n say�n� art�r, skor sisteminde G�venilir seviyesine ula�. �stlerine proaktif rapor ver.',
      week: 'Hafta 8-12',
      color: 'var(--m3b)'
    });
    steps.push({
      title: 'Uzmanl�k Alan� Se�',
      desc: 'Full arch, estetik veneer veya implant � bir alanda derinle�. O alanda ilde referans teknisyen ol.',
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
  // Agent kart�n� k���lt
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
  if (messages) messages.innerHTML = '<div class="agent-msg ai"><span>Merhaba! Yol haritan� yenilemek i�in birka� soru sormam laz�m. Haz�r m�s�n?</span></div>';
  const inputRow = document.getElementById('agent-input-row');
  if (inputRow) inputRow.style.display = 'flex';
  document.getElementById('roadmap-section').style.display = 'none';
  showQuickBtns(agentFlow[0].quick);
}
