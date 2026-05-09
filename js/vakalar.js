// ══════════════════════════════════════════
// VAKA PRATİKLERİ
// ══════════════════════════════════════════
let currentVaka = null;

async function loadVakalar() {
  if (!currentUser) return;
  const grid = document.getElementById('vakalar-grid');
  const loading = document.getElementById('vakalar-loading');
  if (loading) loading.style.display = 'block';
  if (grid) grid.innerHTML = '';

  const {data, error} = await sb.from('vakalar').select('*').eq('aktif', true).order('zorluk');

  if (loading) loading.style.display = 'none';

  if (error || !data?.length) {
    if (grid) grid.innerHTML = '<div style="color:var(--text3);font-size:13px;padding:40px;text-align:center;grid-column:1/-1">Henüz vaka bulunmuyor. Yakında ekleniyor! 🦷</div>';
    return;
  }

  const zorMap = {1:'⭐',2:'⭐⭐',3:'⭐⭐⭐',4:'⭐⭐⭐⭐',5:'⭐⭐⭐⭐⭐'};
  const katMap = {baslangic:'🟢 Başlangıç',orta:'🟡 Orta',ileri:'🔴 İleri',komplikasyon:'🔥 Komplikasyon'};

  data.forEach(v => {
    const card = document.createElement('div');
    card.className = 'f-mod f-mod-1';
    card.style.cssText = 'cursor:pointer;padding:0';
    card.innerHTML = `
      <div class="f-mod-header" style="padding:20px 20px 14px">
        <div class="f-mod-num" style="font-size:11px;margin-bottom:6px">${zorMap[v.zorluk]||'⭐'} · ${katMap[v.kategori]||v.kategori}</div>
        <div class="f-mod-title" style="font-size:16px">${v.baslik}</div>
        <div class="f-mod-tagline" style="font-size:12px;margin-top:4px">${(v.hasta_notu||'').substring(0,80)}${(v.hasta_notu||'').length>80?'...':''}</div>
      </div>
      <div style="padding:0 20px 16px">
        <button onclick="openVakaModal('${v.id}')" style="width:100%;padding:9px;background:linear-gradient(135deg,#1e4fa3,#2a6fc0);border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">Vakayı İncele →</button>
      </div>`;
    grid.appendChild(card);
  });

  window._vakalar = data;
}

async function openVakaModal(id) {
  const v = (window._vakalar||[]).find(x => x.id == id);
  if (!v) return;
  currentVaka = v;

  document.getElementById('vaka-modal-title').textContent = v.baslik;
  document.getElementById('vaka-modal-sub').textContent = `${v.hasta_notu||''} ${v.klinisyen_notu ? '· Klinisyen: '+v.klinisyen_notu : ''}`;

  const imgEl = document.getElementById('vaka-modal-img');
  if (v.gorsel_url) {
    imgEl.innerHTML = `<img src="${v.gorsel_url}" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px">`;
  } else { imgEl.innerHTML = ''; }

  document.getElementById('vaka-degerlendirme').value = '';
  document.getElementById('vaka-pierre-feedback').style.display = 'none';
  document.getElementById('vaka-pierre-feedback').textContent = '';
  document.getElementById('vaka-modal').classList.add('open');
}

function closeVakaModal() {
  document.getElementById('vaka-modal').classList.remove('open');
  currentVaka = null;
}

async function vakaAskPierre() {
  if (!currentVaka) return;
  const not = document.getElementById('vaka-degerlendirme').value.trim();
  const btn = document.getElementById('vaka-pierre-btn');
  btn.disabled = true; btn.textContent = '⏳ Pierre analiz ediyor...';

  const vakaCtx = `Başlık: ${currentVaka.baslik}\nHasta Notu: ${currentVaka.hasta_notu||''}\nKlinisyen Talebi: ${currentVaka.klinisyen_notu||''}\nKategori: ${currentVaka.kategori} | Zorluk: ${currentVaka.zorluk}/5`;

  const feedback = await askPierreFromVaka(vakaCtx, not);
  const el = document.getElementById('vaka-pierre-feedback');
  el.innerHTML = '<strong>🦷 Pierre Fachuard:</strong><br>' + feedback.replace(/\n/g,'<br>');
  el.style.display = 'block';

  btn.disabled = false; btn.textContent = '🦷 Pierre\'e Sor';
}

async function vakaComplete() {
  if (!currentVaka || !currentUser) return;
  const btn = document.getElementById('vaka-tamam-btn');
  btn.disabled = true; btn.textContent = '⏳...';

  const puan = currentVaka.puan || 10;
  const {data:prof} = await sb.from('profiles').select('vaka_puani').eq('id', currentUser.id).single();
  const yeniPuan = (prof?.vaka_puani || 0) + puan;
  await sb.from('profiles').upsert({id: currentUser.id, vaka_puani: yeniPuan});

  showToast(`🏆 Vaka tamamlandı! +${puan} puan kazandın.`);
  closeVakaModal();
  btn.disabled = false; btn.textContent = '✅ Vakayı Tamamla';
}
