// ======================================================
// YOL HARÝTAM — Adaptif AI Haftalýk Sistem
// ======================================================
const YH_STORE = 'yolharita_v2';
let yhState = { done:false, profile:{}, haftalar:[], tamamlanan:[], gorevTam:{}, msgs:[] };
let yhObStep = 0, yhObSel = null, yhOpenHafta = null;

const YH_SORULAR = [
  {
    key:'calisma', multi:false,
    q:'Þu an çalýþma durumun nedir?',
    sub:'Yol haritaný durumuna göre kiþiselleþtireceðiz',
    opts:[
      {v:'lab_calisan',     l:'Lab çalýþanýyým',          d:'Bir laboratuvarda ücretli çalýþýyorum'},
      {v:'freelancer',      l:'Freelancer çalýþýyorum',    d:'Baðýmsýz iþ alýyorum'},
      {v:'is_ariyor',       l:'Ýþ arýyorum',               d:'Yeni bir pozisyon bulmak istiyorum'},
      {v:'lab_kuruyor',     l:'Lab kuruyorum',             d:'Kendi iþimi kurmak üzereyim'},
      {v:'lab_sahibi',      l:'Lab sahibiyim',             d:'Zaten kendi iþletmemi yönetiyorum'},
      {v:'ogrenci',         l:'Öðrenci / Yeni mezun',      d:'Henüz kariyerimin baþýndayým'},
    ]
  },
  {
    key:'deneyim', multi:false,
    q:'Toplam mesleki deneyimin ne kadar?',
    sub:'Eðitim süreniz dahil',
    opts:[
      {v:'0_1',  l:'0–1 yýl',   d:'Yeni baþlýyorum'},
      {v:'1_3',  l:'1–3 yýl',   d:'Temel becerileri öðrendim'},
      {v:'3_5',  l:'3–5 yýl',   d:'Orta düzey deneyim'},
      {v:'5_10', l:'5–10 yýl',  d:'Sektörü iyi tanýyorum'},
      {v:'10p',  l:'10+ yýl',   d:'Sektörde köklü deneyim'},
    ]
  },
  {
    key:'alan', multi:true,
    q:'Hangi alanlarda çalýþýyorsun? (birden fazla seçebilirsin)',
    sub:'Ana uzmanlýk alanlarýný belirt',
    opts:[
      {v:'zirkonyum',   l:'Zirkonyum kaplama',       d:'CAD/CAM ile tam seramik'},
      {v:'pfm',         l:'Metal destekli porselen',  d:'PFM köprü ve kron'},
      {v:'total_protez',l:'Total protez',              d:'Tam diþsiz hastalar'},
      {v:'parsiyel',    l:'Parsiyel protez',           d:'Bölümlü hareketli protez'},
      {v:'implant',     l:'Ýmplant üst yapý',          d:'Kron, köprü, overdenture'},
      {v:'ortodonti',   l:'Ortodonti / Aligner',       d:'Tel, plak, þeffaf aligner'},
      {v:'cad_cam',     l:'CAD/CAM & 3D Tasarým',      d:'Exocad, 3Shape, frezeleme'},
      {v:'estetik',     l:'Estetik restorasyonlar',    d:'Veneer, e.max, kompozit'},
    ]
  },
  {
    key:'hedef', multi:false,
    q:'Þu an odaklandýðýn ana hedefin ne?',
    sub:'En öncelikli olaný seç',
    opts:[
      {v:'hiz_kalite',   l:'Hýz ve kaliteyi artýrmak',  d:'Daha az sürede daha iyi iþ'},
      {v:'gelir',        l:'Gelirimý artýrmak',          d:'Maaþ veya serbest kazanç'},
      {v:'uzmanlasmak',  l:'Belirli alanda uzmanlaþmak', d:'Derinlemesine teknik bilgi'},
      {v:'is_kurmak',    l:'Kendi iþimi kurmak',         d:'Lab veya serbest çalýþma'},
      {v:'dijital',      l:'Dijital sistemlere geçmek',  d:'CAD/CAM, 3D baský, tarama'},
      {v:'yonetim',      l:'Ekip yönetimi öðrenmek',     d:'Liderlik ve operasyon'},
    ]
  },
  {
    key:'engel', multi:false,
    q:'Þu an seni en çok zorlayan þey ne?',
    sub:'Dürüst cevap daha iyi bir plan çýkarýr',
    opts:[
      {v:'teknik',     l:'Teknik bilgi eksikliði',  d:'Bazý prosedürler hala zor'},
      {v:'hiz',        l:'Yavaþ çalýþmak',           d:'Ýstediðim hýzda üretemiyorum'},
      {v:'musteri',    l:'Müþteri / patron iliþkisi', d:'Ýletiþim ve fiyatlandýrma sorunu'},
      {v:'motivasyon', l:'Motivasyon kaybý',          d:'Yönümü bulamýyorum'},
      {v:'sermaye',    l:'Sermaye / ekipman eksikliði',d:'Yatýrým yapamýyorum'},
      {v:'pazar',      l:'Pazar bulamýyorum',          d:'Yeterli iþ yok / müþteri yok'},
    ]
  },
  {
    key:'zaman', multi:false,
    q:'Haftada geliþime kaç saat ayýrabilirsin?',
    sub:'Gerçekçi ol — plan buna göre yapýlýr',
    opts:[
      {v:'1_2',  l:'1–2 saat',   d:'Çok yoðun, kýsa ama etkili görevler'},
      {v:'3_5',  l:'3–5 saat',   d:'Orta tempo, dengeli plan'},
      {v:'5_10', l:'5–10 saat',  d:'Kararlý ilerleme, kapsamlý görevler'},
      {v:'10p',  l:'10+ saat',   d:'Tam gaz, yoðun dönüþüm planý'},
    ]
  },
];
// multi-select state
let yhMultiSel = {};

function yhLoad() {
  try { const s = localStorage.getItem(YH_STORE+'_'+(currentUser?.id||'x')); if(s) yhState = JSON.parse(s); } catch(e) {}
}
function yhSave() {
  try { localStorage.setItem(YH_STORE+'_'+(currentUser?.id||'x'), JSON.stringify(yhState)); } catch(e) {}
}

function yhInit() {
  yhLoad();
  if (yhState.done) { yhShowMain(); } else { yhShowOnboard(); }
}

// ¦¦ ONBOARD ¦¦
function yhShowOnboard() {
  document.getElementById('yh-onboard-panel').style.display = 'flex';
  document.getElementById('yh-main-panel').style.display = 'none';
  yhObStep = 0; yhObSel = null;
  yhRenderStep();
}

function yhRenderStep() {
  const s = YH_SORULAR[yhObStep];
  document.getElementById('yh-prog').style.width = ((yhObStep / YH_SORULAR.length) * 100) + '%';
  document.getElementById('yh-ob-icon').textContent = '';
  document.getElementById('yh-ob-q').textContent = s.q;
  document.getElementById('yh-ob-s').textContent = s.sub || ((yhObStep + 1) + ' / ' + YH_SORULAR.length + ' soru');
  yhObSel = null;
  yhMultiSel[s.key] = yhMultiSel[s.key] || [];
  document.getElementById('yh-ob-btn').style.display = 'none';
  if (s.multi) {
    document.getElementById('yh-ob-opts').innerHTML = s.opts.map(o =>
      `<div class="yh-option" data-val="${o.v}" onclick="yhPickMulti(this,'${s.key}','${o.v}')">
        <div style="font-weight:600;font-size:13px;margin-bottom:2px">${o.l}</div>
        <div style="font-size:11.5px;opacity:.65">${o.d}</div>
      </div>`
    ).join('') + '<div style="grid-column:1/-1;font-size:11px;color:var(--text3);text-align:center;margin-top:4px">Birden fazla seçebilirsin</div>';
  } else {
    document.getElementById('yh-ob-opts').innerHTML = s.opts.map(o =>
      `<div class="yh-option" data-val="${o.v}" onclick="yhPickOpt(this,'${o.v}')">
        <div style="font-weight:600;font-size:13px;margin-bottom:2px">${o.l}</div>
        <div style="font-size:11.5px;opacity:.65">${o.d}</div>
      </div>`
    ).join('');
  }
}

function yhPickOpt(el, val) {
  document.querySelectorAll('#yh-ob-opts .yh-option').forEach(e => e.classList.remove('sel'));
  el.classList.add('sel');
  yhObSel = val;
  document.getElementById('yh-ob-btn').style.display = 'block';
}

function yhPickMulti(el, key, val) {
  if (!yhMultiSel[key]) yhMultiSel[key] = [];
  if (el.classList.contains('sel')) {
    el.classList.remove('sel');
    yhMultiSel[key] = yhMultiSel[key].filter(v => v !== val);
  } else {
    el.classList.add('sel');
    yhMultiSel[key].push(val);
  }
  document.getElementById('yh-ob-btn').style.display = yhMultiSel[key].length > 0 ? 'block' : 'none';
  yhObSel = yhMultiSel[key].join(',');
}

async function yhObNext() {
  if (!yhObSel) return;
  yhState.profile[YH_SORULAR[yhObStep].key] = yhObSel;
  yhObStep++;
  if (yhObStep < YH_SORULAR.length) {
    yhRenderStep();
  } else {
    // Generating state
    document.getElementById('yh-prog').style.width = '90%';
    document.getElementById('yh-ob-icon').textContent = '?';
    document.getElementById('yh-ob-q').textContent = 'Kiþisel haritaný oluþturuyorum…';
    document.getElementById('yh-ob-s').textContent = 'Bu birkaç saniye sürebilir';
    document.getElementById('yh-ob-opts').innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:20px 0;color:var(--text3);font-size:13px;">
      <div style="display:flex;gap:5px;justify-content:center;margin-bottom:12px">
        <span style="width:8px;height:8px;border-radius:50%;background:var(--m1b);animation:yhDot 1.2s infinite"></span>
        <span style="width:8px;height:8px;border-radius:50%;background:var(--m1b);animation:yhDot 1.2s .2s infinite"></span>
        <span style="width:8px;height:8px;border-radius:50%;background:var(--m1b);animation:yhDot 1.2s .4s infinite"></span>
      </div>
      AI profilinizi analiz ediyor ve haftalýk görevleri kiþiselleþtiriyor…
    </div>`;
    document.getElementById('yh-ob-btn').style.display = 'none';
    await yhGenerateMap();
  }
}

async function yhGenerateMap() {
  const p = yhState.profile;
  const alanlar = (p.alan||'').split(',').map(v=>({
    zirkonyum:'Zirkonyum kaplama',pfm:'PFM',total_protez:'Total protez',
    parsiyel:'Parsiyel protez',implant:'Ýmplant üst yapý',ortodonti:'Ortodonti/Aligner',
    cad_cam:'CAD/CAM & 3D',estetik:'Estetik restorasyonlar'
  }[v]||v)).filter(Boolean).join(', ');

  const prompt = `Sen uzman bir diþ teknisyeni mentoru ve kariyer koçusun. Aþaðýdaki profile göre 8 haftalýk KÝÞÝSEL yol haritasý oluþtur.

KULLANICI PROFÝLÝ:
- Çalýþma durumu: ${({'lab_calisan':'Lab çalýþaný','freelancer':'Freelancer','is_ariyor':'Ýþ arýyor','lab_kuruyor':'Lab kuruyor','lab_sahibi':'Lab sahibi','ogrenci':'Öðrenci/Yeni mezun'}[p.calisma]||p.calisma)}
- Deneyim: ${({'0_1':'0-1 yýl','1_3':'1-3 yýl','3_5':'3-5 yýl','5_10':'5-10 yýl','10p':'10+ yýl'}[p.deneyim]||p.deneyim)}
- Uzmanlýk alanlarý: ${alanlar||'Belirtilmemiþ'}
- Ana hedef: ${({'hiz_kalite':'Hýz ve kaliteyi artýrmak','gelir':'Gelir artýrmak','uzmanlasmak':'Uzmanlaþmak','is_kurmak':'Ýþ kurmak','dijital':'Dijital sistemlere geçmek','yonetim':'Ekip yönetimi'}[p.hedef]||p.hedef)}
- Þu an zorluðu: ${({'teknik':'Teknik bilgi eksikliði','hiz':'Yavaþ çalýþma','musteri':'Müþteri/patron iliþkisi','motivasyon':'Motivasyon kaybý','sermaye':'Sermaye eksikliði','pazar':'Pazar bulamýyor'}[p.engel]||p.engel)}
- Haftalýk süre: ${({'1_2':'1-2 saat','3_5':'3-5 saat','5_10':'5-10 saat','10p':'10+ saat'}[p.zaman]||p.zaman)}

KURALLAR:
1. Her hafta 6-7 SOMUT ve YAPILABILIR görev. Sadece "oku/araþtýr" deðil, gerçek yapma eylemi (kaydet, uygula, ölç, dene, analiz et, yaz, karþýlaþtýr).
2. Haftalar arasýnda mantýksal ilerleme — temellerden uzmanlýða.
3. Profildeki duruma ÖZEL: Freelancer için müþteri yönetimi, lab çalýþaný için verimlilik, iþ arayan için portföy.
4. Her hafta gerçekten 3-7 saat iþ gerektirecek yoðunlukta. Tek günde bitmeyecek görevler.
5. Zorluða (${p.engel}) ve hedefe (${p.hedef}) doðrudan cevap veren görevler ekle.

SADECE aþaðýdaki JSON formatýnda cevap ver, baþka hiçbir þey yazma:
{
  "ozet": "Kullanýcý için 1-2 cümle kiþisel plan özeti",
  "haftalar": [
    {
      "hafta": 1,
      "baslik": "Kýsa motive edici baþlýk (max 4 kelime)",
      "odak": "Bu haftanýn tek cümle odaðý",
      "gorevler": [
        { "baslik": "Görev adý (kýsa)", "detay": "Nasýl yapýlacaðýnýn net açýklamasý — somut adýmlarla" }
      ]
    }
  ]
}`;

  try {
    const {data:{session:yhSess}} = await sb.auth.getSession();
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (yhSess?.access_token || '')
      },
      body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:5000, messages:[{ role:'user', content:prompt }] })
    });
    const data = await res.json();
    const raw = data.content.map(c => c.text||'').join('');
    const clean = raw.replace(/```json|```/g,'').trim();
    const parsed = JSON.parse(clean);
    yhState.haftalar = parsed.haftalar;
    yhState.done = true;
    yhState.tamamlanan = [];
    yhState.gorevTam = {};
    yhState.msgs = [{ role:'ai', text:`Haritaný oluþturdum! ??

${parsed.ozet || ''}

${yhState.haftalar.length} haftalýk planýn hazýr. Hafta kartlarýný týklayarak görevleri gör. Ýstediðin zaman bana revizyon veya soru sorabilirsin.` }];
    yhSave();
    yhShowMain();
  } catch(e) {
    console.error('YH Generate error:', e);
    document.getElementById('yh-ob-q').textContent = 'Baðlantý hatasý oluþtu';
    document.getElementById('yh-ob-s').textContent = 'Lütfen tekrar dene';
    document.getElementById('yh-ob-btn').style.display = 'block';
    document.getElementById('yh-ob-btn').textContent = '? Tekrar Dene';
    document.getElementById('yh-ob-opts').innerHTML = '';
    yhObStep = YH_SORULAR.length; // re-trigger generate on click
  }
}

// ¦¦ ANA HARÝTA ¦¦
function yhShowMain() {
  document.getElementById('yh-onboard-panel').style.display = 'none';
  document.getElementById('yh-main-panel').style.display = 'block';
  yhRenderGrid();
  yhRenderMsgs();
}

function yhRenderGrid() {
  const haftalar = yhState.haftalar || [];
  const tam = yhState.tamamlanan || [];
  if (!haftalar.length) return;

  // Stats
  document.getElementById('yh-stat-done').textContent = tam.length;
  document.getElementById('yh-stat-cur').textContent = Math.min(tam.length + 1, haftalar.length);
  let tot = 0, don = 0;
  haftalar.forEach((h,i) => {
    const gt = yhState.gorevTam[i] || [];
    tot += (h.gorevler||[]).length;
    don += gt.length;
  });
  document.getElementById('yh-stat-score').textContent = tot > 0 ? '%' + Math.round((don/tot)*100) : '%0';

  // Grid
  const grid = document.getElementById('yh-hafta-grid');
  grid.innerHTML = haftalar.map((h, i) => {
    const isDone = tam.includes(i);
    const isOpen = i <= tam.length;
    const cls = isDone ? 'done' : isOpen ? 'active' : 'locked';
    const ico = isDone ? '?' : isOpen ? '?' : '??';
    const click = isOpen ? `onclick="yhOpenModal(${i})"` : '';
    const gt = yhState.gorevTam[i] || [];
    const total = (h.gorevler||[]).length;
    const prog = total > 0 ? Math.round((gt.length/total)*100) : 0;
    return `<div class="yh-hafta-card ${cls}" ${click}>
      <div class="yh-hafta-status">${ico}</div>
      <div class="yh-hafta-num">Hafta ${h.hafta}</div>
      <div class="yh-hafta-title">${h.baslik||''}</div>
      <div class="yh-hafta-sub">${h.odak||''}</div>
      ${isOpen && !isDone ? `<div style="margin-top:10px;height:2px;background:var(--border);border-radius:2px"><div style="width:${prog}%;height:100%;background:var(--m1b);border-radius:2px;transition:width .3s"></div></div>` : ''}
    </div>`;
  }).join('');
}

// ¦¦ MODAL ¦¦
function yhOpenModal(idx) {
  yhOpenHafta = idx;
  const h = yhState.haftalar[idx];
  if (!h) return;
  document.getElementById('yh-m-num').textContent = 'Hafta ' + h.hafta;
  document.getElementById('yh-m-title').textContent = h.baslik||'';
  document.getElementById('yh-m-odak').textContent = h.odak||'';
  const gorevler = h.gorevler||[];
  const gt = yhState.gorevTam[idx]||[];
  document.getElementById('yh-m-gorevler').innerHTML = gorevler.map((g,gi) => {
    const done = gt.includes(gi);
    return `<div class="yh-gorev-item">
      <div class="yh-gorev-cb ${done?'checked':''}" onclick="yhToggle(${idx},${gi})">${done?'?':''}</div>
      <div>
        <div class="yh-gorev-text" style="${done?'text-decoration:line-through;opacity:.5':''}">${g.baslik}</div>
        <div class="yh-gorev-detail">${g.detay||''}</div>
      </div>
    </div>`;
  }).join('');
  const pct = gorevler.length > 0 ? Math.round((gt.length/gorevler.length)*100) : 0;
  document.getElementById('yh-m-progress').textContent = `${gt.length} / ${gorevler.length} görev tamamlandý (%${pct})`;
  const allDone = gorevler.length > 0 && gt.length >= gorevler.length;
  const hDone = (yhState.tamamlanan||[]).includes(idx);
  document.getElementById('yh-m-bitir-btn').style.display = (allDone && !hDone) ? 'block' : 'none';
  document.getElementById('yh-modal').classList.add('open');
}

function yhToggle(hi, gi) {
  const gt = yhState.gorevTam[hi]||[];
  const pos = gt.indexOf(gi);
  if (pos >= 0) { gt.splice(pos,1); } else { gt.push(gi); }
  yhState.gorevTam[hi] = gt;
  yhSave();
  yhOpenModal(hi);
  yhRenderGrid();
}

function yhHaftaBitir() {
  if (yhOpenHafta === null) return;
  if (!yhState.tamamlanan) yhState.tamamlanan = [];
  if (!yhState.tamamlanan.includes(yhOpenHafta)) yhState.tamamlanan.push(yhOpenHafta);
  yhSave();
  yhCloseModal();
  yhRenderGrid();
  const nextH = yhState.haftalar[yhState.tamamlanan.length];
  const msg = nextH
    ? `Hafta ${yhOpenHafta+1} tamamlandý! ?? Tebrikler!

Sýradaki: "${nextH.baslik}" — "${nextH.odak}"

Hafta kartýný týklayarak baþlayabilirsin. Hazýr olduðunda bildir!`
    : `Tüm 8 haftayý tamamladýn! ?? Bu inanýlmaz bir baþarý.

Bana bundan sonra ne yapmak istediðini yaz — yeni hedefler belirleyelim!`;
  yhState.msgs.push({ role:'ai', text:msg });
  yhSave();
  yhRenderMsgs();
}

function yhCloseModal() {
  document.getElementById('yh-modal').classList.remove('open');
}

// ¦¦ CHAT ¦¦
function yhRenderMsgs() {
  const msgs = yhState.msgs||[];
  const c = document.getElementById('yh-msgs');
  c.innerHTML = msgs.map(m => `
    <div class="yh-msg ${m.role==='user'?'user':''}">
      <div class="yh-bubble" style="white-space:pre-line">${m.text}</div>
    </div>
  `).join('');
  c.scrollTop = c.scrollHeight;
}

async function yhSend() {
  const input = document.getElementById('yh-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  document.getElementById('yh-send-btn').disabled = true;
  yhState.msgs.push({ role:'user', text });
  yhRenderMsgs();

  // Typing indicator
  const c = document.getElementById('yh-msgs');
  const te = document.createElement('div');
  te.id = 'yh-typing-el';
  te.className = 'yh-msg';
  te.innerHTML = '<div class="yh-bubble"><div class="yh-typing"><span></span><span></span><span></span></div></div>';
  c.appendChild(te);
  c.scrollTop = c.scrollHeight;

  try {
    const p = yhState.profile;
    const sys = `Sen diþ teknisyeni geliþim koçusun. Kullanýcý profili: ${JSON.stringify(p)}. Tamamlanan haftalar: ${yhState.tamamlanan?.length||0}/${yhState.haftalar?.length||0}. Aktif hafta planý: ${JSON.stringify((yhState.haftalar||[]).map(h=>({h:h.hafta,b:h.baslik,o:h.odak})))}. Türkçe, samimi ve motive edici cevap ver. Revizyon isterse veya ek görev talep ederse yardým et. 2-4 cümle yeterli.`;
    const histMsgs = (yhState.msgs||[]).slice(-8).map(m => ({ role: m.role==='user'?'user':'assistant', content: m.text }));
    const {data:{session:yhSess2}} = await sb.auth.getSession();
    const res = await fetch(PROXY_URL, {
      method:'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (yhSess2?.access_token || '')
      },
      body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:600, system:sys, messages:histMsgs })
    });
    const data = await res.json();
    const reply = data.content.map(c=>c.text||'').join('').trim();
    document.getElementById('yh-typing-el')?.remove();
    yhState.msgs.push({ role:'ai', text:reply });
    yhSave();
    yhRenderMsgs();
  } catch(e) {
    document.getElementById('yh-typing-el')?.remove();
    yhState.msgs.push({ role:'ai', text:'Baðlantý hatasý. Tekrar dene.' });
    yhRenderMsgs();
  }
  document.getElementById('yh-send-btn').disabled = false;
}

// Navigate hook
const _yhOrig = navigate;
navigate = function(page, el) {
  _yhOrig(page, el);
  if (page === 'yolharita' && currentUser) setTimeout(yhInit, 60);
};
