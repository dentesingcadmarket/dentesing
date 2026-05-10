async function loadDashboard() {
  if (!currentUser) return;
  // Dashboard greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';
  const greetEl = document.getElementById('dash-greeting');
  const subEl = document.getElementById('dash-sub');
  if (greetEl) greetEl.textContent = greeting + ' 👋';
  if (subEl) subEl.textContent = 'Bugün ne üzerinde çalışıyorsun?';
  // Agent başlat
  initAgent();
  const [g,h,gAll,hAll] = await Promise.all([
    sb.from('gunluk_takip').select('*').eq('user_id',currentUser.id).order('tarih',{ascending:false}).limit(5),
    sb.from('hata_gunlugu').select('*').eq('user_id',currentUser.id).order('tarih',{ascending:false}).limit(5),
    sb.from('gunluk_takip').select('sure,hata_sayisi').eq('user_id',currentUser.id),
    sb.from('hata_gunlugu').select('id').eq('user_id',currentUser.id)
  ]);
  const rows=gAll.data||[];
  document.getElementById('kpi-is').textContent=rows.length||0;
  const avg=rows.length?Math.round(rows.reduce((a,r)=>a+(r.sure||0),0)/rows.length):0;
  document.getElementById('kpi-sure').innerHTML=avg?`${avg}<span style="font-size:16px;color:var(--text2)">dk</span>`:'—';
  document.getElementById('kpi-hata').textContent=(hAll.data||[]).length||0;

  const gt=document.getElementById('dash-gunluk'); gt.innerHTML='';
  if (!g.data?.length) { gt.innerHTML='<tr class="empty-row"><td colspan="5">Henüz kayıt yok 👆</td></tr>'; }
  else g.data.forEach(r=>{
    const durum=(r.hata_sayisi||0)===0?'<span class="badge green">✅ Temiz</span>':'<span class="badge orange">⚠️ Geliştirilmeli</span>';
    gt.innerHTML+=`<tr><td>${fmtDate(r.tarih)}</td><td><span class="badge blue">${r.is_turu||'—'}</span></td><td>${r.sure||0}dk</td><td>${r.hata_sayisi||0}</td><td>${durum}</td></tr>`;
  });
  const ht=document.getElementById('dash-hata'); ht.innerHTML='';
  if (!h.data?.length) { ht.innerHTML='<tr class="empty-row"><td colspan="4">Henüz hata kaydı yok 🎉</td></tr>'; }
  else h.data.forEach(r=>{
    const tekrar=r.tekrarlandi?'<span class="badge red">Evet</span>':'<span class="badge green">Hayır</span>';
    const kritik=r.tekrarlandi?'<span style="color:var(--orange)">⚠️ Kritik</span>':'';
    ht.innerHTML+=`<tr><td>${fmtDate(r.tarih)}</td><td>${r.hata||'—'}</td><td>${tekrar}</td><td>${kritik}</td></tr>`;
  });
}

// ── GÜNLÜK TAKİP ──
async function loadGunluk() {
  if (!currentUser) return;
  let q=sb.from('gunluk_takip').select('*').eq('user_id',currentUser.id).order('tarih',{ascending:false});
  const today=new Date().toISOString().split('T')[0];
  if (gunlukFilter==='bugun') q=q.eq('tarih',today);
  else if (gunlukFilter==='hafta') { const w=new Date(); w.setDate(w.getDate()-7); q=q.gte('tarih',w.toISOString().split('T')[0]); }
  const {data}=await q; const tbody=document.getElementById('gunluk-tbody'); tbody.innerHTML='';
  if (!data?.length) { tbody.innerHTML='<tr class="empty-row"><td colspan="8">Bu filtre için kayıt yok.</td></tr>'; return; }
  data.forEach(r=>{
    const durum=(r.hata_sayisi||0)===0?'<span class="badge green">✅ Temiz</span>':'<span class="badge orange">⚠️ Geliştirilmeli</span>';
    const zb=r.zorluk==='Kolay'?'green':r.zorluk==='Zor'?'red':'orange';
    const dosyaCell = r.dosya_url
      ? (r.dosya_url.toLowerCase().endsWith('.stl')
          ? `<span title="${r.dosya_url}" style="cursor:pointer">📦</span>`
          : `<img src="${r.dosya_url}" style="width:32px;height:32px;object-fit:cover;border-radius:4px;cursor:pointer" onclick="window.open('${r.dosya_url}','_blank')" title="Görseli aç">`)
      : '—';
    tbody.innerHTML+=`<tr><td>${fmtDate(r.tarih)}</td><td><span class="badge blue">${r.is_turu||'—'}</span></td><td>${r.sure||0}</td><td>${r.hata_sayisi||0}</td><td><span class="badge ${zb}">${r.zorluk||'—'}</span></td><td>${durum}</td><td style="color:var(--text3);font-size:12px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.not_||''}</td><td>${dosyaCell}</td><td><button class="delete-btn" onclick="deleteRecord('gunluk_takip','${r.id}','gunluk')">✕</button></td></tr>`;
  });
}
function setGunlukFilter(f,el) { gunlukFilter=f; document.querySelectorAll('#gunluk-tabs .view-tab').forEach(t=>t.classList.remove('active')); el.classList.add('active'); loadGunluk(); }

// ── HATA GÜNLÜĞÜ ──
async function loadHata() {
  if (!currentUser) return;
  const {data}=await sb.from('hata_gunlugu').select('*').eq('user_id',currentUser.id).order('tarih',{ascending:false});
  const tbody=document.getElementById('hata-tbody'); tbody.innerHTML='';
  if (!data?.length) { tbody.innerHTML='<tr class="empty-row"><td colspan="7">Henüz hata kaydı yok 🎉</td></tr>'; return; }
  data.forEach(r=>{
    const tekrar=r.tekrarlandi?'<span class="badge red">Evet</span>':'<span class="badge green">Hayır</span>';
    const kritik=r.tekrarlandi?'<span style="color:var(--orange)">⚠️ Kritik</span>':'';
    tbody.innerHTML+=`<tr><td>${fmtDate(r.tarih)}</td><td>${r.hata||'—'}</td><td style="color:var(--text3);font-size:12px">${r.sebep||'—'}</td><td style="color:var(--text3);font-size:12px">${r.cozum||'—'}</td><td>${tekrar}</td><td>${kritik}</td><td><button class="delete-btn" onclick="deleteRecord('hata_gunlugu','${r.id}','hata')">✕</button></td></tr>`;
  });
}

async function loadHataAnaliz() {
  if (!currentUser) return;
  const btn = document.getElementById('hata-analiz-btn');
  const resultEl = document.getElementById('hata-analiz-result');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Analiz ediliyor...'; }
  if (resultEl) resultEl.style.display = 'none';

  const {data} = await sb.from('hata_gunlugu').select('hata,sebep,tekrarlandi').eq('user_id', currentUser.id).limit(20);
  if (!data?.length) {
    if (resultEl) { resultEl.textContent = 'Analiz için en az 1 hata kaydı gerekli.'; resultEl.style.display = 'block'; }
    if (btn) { btn.disabled = false; btn.textContent = '🤖 AI Analiz'; }
    return;
  }

  const hataListesi = data.map(h => `- ${h.hata}${h.sebep?' (Sebep: '+h.sebep+')':''}${h.tekrarlandi?' [TEKRAR ETTİ]':''}`).join('\n');

  try {
    const {data:{session}} = await sb.auth.getSession();
    const token = session?.access_token;
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: 'Sen diş teknisyeni koçusun. Verilen hata listesini analiz et, en sık tekrar eden paterni bul, 2-3 cümle özet ve 1 pratik öneri ver. Türkçe. Kısa ve net ol.',
        messages: [{ role: 'user', content: 'Hata listesi:\n' + hataListesi }]
      })
    });
    const json = await res.json();
    const text = json.content?.[0]?.text || json.error?.message || 'Analiz alınamadı.';
    if (resultEl) { resultEl.innerHTML = '🤖 <strong>AI Analiz:</strong><br>' + text.replace(/\n/g,'<br>'); resultEl.style.display = 'block'; }
  } catch(e) {
    if (resultEl) { resultEl.textContent = 'Bağlantı hatası: ' + e.message; resultEl.style.display = 'block'; }
  }

  if (btn) { btn.disabled = false; btn.textContent = '🤖 AI Analiz'; }
}

// ── GELİŞİM ──
async function loadGelisim() {
  if (!currentUser) return;
  const key=`gelisim_${currentUser.id}`;
  const saved=localStorage.getItem(key);
  if (saved) { const d=JSON.parse(saved); document.getElementById('gel-hiz').value=d.hiz||''; document.getElementById('gel-hata').value=d.hata||''; document.getElementById('gel-ogr').value=d.ogr||''; }
}
function saveGelisim() {
  if (!currentUser) return;
  localStorage.setItem(`gelisim_${currentUser.id}`,JSON.stringify({hiz:document.getElementById('gel-hiz').value,hata:document.getElementById('gel-hata').value,ogr:document.getElementById('gel-ogr').value}));
  showToast('✅ Gelişim notları kaydedildi!');
}

// ── DELETE ──
async function deleteRecord(table,id,page) {
  await sb.from(table).delete().eq('id',id);
  showToast('🗑 Kayıt silindi.');
  if (page==='gunluk') loadGunluk();
  if (page==='hata') loadHata();
  loadDashboard();
}

// ── APP MODAL ──
const modals = {
  gun:{title:'Yeni Gün Başlat',sub:'Bugünkü çalışma bilgilerini gir',body:`<div class="modal-field"><label class="modal-label">İş Türü</label><select class="modal-select" id="m-isturi"><option>Zirkonyum</option><option>PFM</option><option>İmplant</option><option>Veneer</option><option>Diğer</option></select></div><div class="modal-field"><label class="modal-label">Süre (dakika)</label><input class="modal-input" type="number" id="m-sure" placeholder="35" min="0"/></div><div class="modal-field"><label class="modal-label">Hata Sayısı</label><input class="modal-input" type="number" id="m-hatasayisi" placeholder="0" min="0" value="0"/></div><div class="modal-field"><label class="modal-label">Zorluk</label><select class="modal-select" id="m-zorluk"><option>Kolay</option><option>Orta</option><option>Zor</option></select></div><div class="modal-field"><label class="modal-label">Not (maks 250 karakter)</label><input class="modal-input" type="text" id="m-not" placeholder="Bugün başlıyorum" maxlength="250"/></div><div class="modal-field"><label class="modal-label">Görsel veya STL (opsiyonel)</label><input class="modal-input" type="file" id="m-dosya" accept=".png,.jpg,.jpeg,.stl" style="padding:6px"/></div>`},
  hata:{title:'Yeni Hata Ekle',sub:'Hatayı kaydet, sebebini yaz',body:`<div class="modal-field"><label class="modal-label">Hata</label><input class="modal-input" type="text" id="m-hata" placeholder="Ne hata yaptın?"/></div><div class="modal-field"><label class="modal-label">Sebep</label><input class="modal-input" type="text" id="m-sebep" placeholder="Neden oldu?"/></div><div class="modal-field"><label class="modal-label">Çözüm</label><input class="modal-input" type="text" id="m-cozum" placeholder="Bir dahaki sefere ne yaparsın?"/></div><div class="modal-field"><label class="modal-label">Daha önce yaptın mı?</label><select class="modal-select" id="m-tekrar"><option value="false">Hayır</option><option value="true">Evet</option></select></div>`}
};
function openModal(type) {
  currentModal=type; const m=modals[type];
  document.getElementById('modal-title').textContent=m.title;
  document.getElementById('modal-sub').textContent=m.sub;
  document.getElementById('modal-body').innerHTML=m.body;
  document.getElementById('modal').classList.add('open');
}
function closeModal() { document.getElementById('modal').classList.remove('open'); }
async function submitModal() {
  const btn=document.getElementById('modal-save');
  btn.disabled=true; btn.textContent='Kaydediliyor...';
  try {
    const today=new Date().toISOString().split('T')[0];
    if (currentModal==='gun') {
      let dosyaUrl = null;
      const dosyaInput = document.getElementById('m-dosya');
      if (dosyaInput?.files?.[0]) {
        const file = dosyaInput.files[0];
        const ext = file.name.split('.').pop().toLowerCase();
        const path = `${currentUser.id}/${Date.now()}.${ext}`;
        const {data:upData, error:upErr} = await sb.storage.from('is-gorselleri').upload(path, file);
        if (!upErr && upData) {
          const {data:urlData} = sb.storage.from('is-gorselleri').getPublicUrl(path);
          dosyaUrl = urlData?.publicUrl || null;
        }
      }
      await sb.from('gunluk_takip').insert({user_id:currentUser.id,tarih:today,is_turu:document.getElementById('m-isturi').value,sure:parseInt(document.getElementById('m-sure').value)||0,hata_sayisi:parseInt(document.getElementById('m-hatasayisi').value)||0,zorluk:document.getElementById('m-zorluk').value,not_:document.getElementById('m-not').value,dosya_url:dosyaUrl});
      showToast('✅ Yeni gün kaydedildi!'); loadGunluk();
    } else if (currentModal==='hata') {
      await sb.from('hata_gunlugu').insert({user_id:currentUser.id,tarih:today,hata:document.getElementById('m-hata').value,sebep:document.getElementById('m-sebep').value,cozum:document.getElementById('m-cozum').value,tekrarlandi:document.getElementById('m-tekrar').value==='true'});
      showToast('⚠️ Hata günlüğüne eklendi!'); loadHata();
    }
    closeModal(); loadDashboard();
  } catch(e) { showToast('❌ Hata: '+e.message); }
  btn.disabled=false; btn.textContent='Kaydet';
}

// ── YARDIMCI ──
function fmtDate(d) { if(!d) return '—'; return new Date(d).toLocaleDateString('tr-TR',{day:'numeric',month:'short',year:'numeric'}); }
function showToast(msg) { const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2800); }

document.getElementById('modal').addEventListener('click',e=>{ if(e.target===document.getElementById('modal')) closeModal(); });
document.getElementById('authModal').addEventListener('click',e=>{ if(e.target===document.getElementById('authModal')) closeAuthModal(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape') { closeModal(); closeAuthModal(); } });
