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
  // Sağ panel sync
  const rpIs=document.getElementById('rp-kpi-is');
  const rpHata=document.getElementById('rp-kpi-hata');
  if(rpIs) rpIs.textContent=rows.length||0;
  if(rpHata) rpHata.textContent=(hAll.data||[]).length||0;

  const AVATAR_COLORS=['linear-gradient(135deg,#4a90d9,#1e293b)','linear-gradient(135deg,#e8b840,#1e293b)','linear-gradient(135deg,#9b6dd0,#1e293b)','linear-gradient(135deg,#e05050,#1e293b)','linear-gradient(135deg,#50a060,#1e293b)'];
  const gt=document.getElementById('dash-gunluk'); gt.innerHTML='';
  if (!g.data?.length) { gt.innerHTML='<div class="item-empty">Henüz kayıt yok 👆</div>'; }
  else g.data.forEach((r,i)=>{
    const durum=(r.hata_sayisi||0)===0?'<span class="badge green">✅ Temiz</span>':'<span class="badge orange">⚠️ Geliştirilmeli</span>';
    const featured=i===0?' item-featured':'';
    gt.innerHTML+=`<div class="item-card${featured}"><div class="item-avatar" style="background:${AVATAR_COLORS[i%AVATAR_COLORS.length]}">${(r.is_turu||'?').charAt(0)}</div><div class="item-body"><div class="item-top"><span class="item-name">${r.is_turu||'—'}</span><span class="item-time">${fmtDate(r.tarih)}</span></div><div class="item-preview">${r.sure||0}dk · ${r.hata_sayisi||0} hata · ${r.zorluk||'—'}</div><div class="item-meta">${durum}</div></div></div>`;
  });
  const ht=document.getElementById('dash-hata'); ht.innerHTML='';
  if (!h.data?.length) { ht.innerHTML='<div class="item-empty">Henüz hata kaydı yok 🎉</div>'; }
  else h.data.forEach((r,i)=>{
    const tekrar=r.tekrarlandi?'<span class="badge red">Tekrar</span>':'<span class="badge green">İlk</span>';
    const featured=i===0?' item-featured':'';
    const avatarBg=r.tekrarlandi?'linear-gradient(135deg,#e05050,#1e293b)':'linear-gradient(135deg,#50a060,#1e293b)';
    ht.innerHTML+=`<div class="item-card${featured}"><div class="item-avatar" style="background:${avatarBg}">${(r.hata||'H').charAt(0).toUpperCase()}</div><div class="item-body"><div class="item-top"><span class="item-name">${r.hata||'—'}</span><span class="item-time">${fmtDate(r.tarih)}</span></div><div class="item-preview">${r.sebep||'Sebep belirtilmedi'}</div><div class="item-meta">${tekrar}${r.tekrarlandi?'<span class="item-critical">⚠️ Kritik</span>':''}</div></div></div>`;
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
  if (!data?.length) { tbody.innerHTML='<div class="item-empty">Bu filtre için kayıt yok.</div>'; return; }
  const AC=['linear-gradient(135deg,#4a90d9,#1e293b)','linear-gradient(135deg,#e8b840,#1e293b)','linear-gradient(135deg,#9b6dd0,#1e293b)','linear-gradient(135deg,#e05050,#1e293b)','linear-gradient(135deg,#50a060,#1e293b)'];
  data.forEach((r,i)=>{
    const durum=(r.hata_sayisi||0)===0?'<span class="badge green">✅ Temiz</span>':'<span class="badge orange">⚠️ Geliştirilmeli</span>';
    const zb=r.zorluk==='Kolay'?'tag-m1':r.zorluk==='Zor'?'tag-m3':'tag-m2';
    const featured=i===0?' item-featured':'';
    const dosyaBtn=r.dosya_url?(r.dosya_url.toLowerCase().endsWith('.stl')?`<span class="item-file" title="STL">📦</span>`:`<img src="${r.dosya_url}" class="item-thumb" onclick="window.open('${r.dosya_url}','_blank')" title="Görseli aç">`):'';
    tbody.innerHTML+=`<div class="item-card${featured}"><div class="item-avatar" style="background:${AC[i%AC.length]}">${(r.is_turu||'?').charAt(0)}</div><div class="item-body"><div class="item-top"><span class="item-name">${r.is_turu||'—'}</span><span class="item-time">${fmtDate(r.tarih)}</span></div><div class="item-preview">${r.sure||0}dk · ${r.hata_sayisi||0} hata${r.not_?' · '+r.not_:''}</div><div class="item-meta"><span class="tag-badge ${zb}">${r.zorluk||'—'}</span>${durum}${dosyaBtn}</div></div><button class="delete-btn" onclick="deleteRecord('gunluk_takip','${r.id}','gunluk')">✕</button></div>`;
  });
}
function setGunlukFilter(f,el) { gunlukFilter=f; document.querySelectorAll('#gunluk-tabs .view-tab').forEach(t=>t.classList.remove('active')); el.classList.add('active'); loadGunluk(); }

// ── HATA GÜNLÜĞÜ ──
async function loadHata() {
  if (!currentUser) return;
  const {data}=await sb.from('hata_gunlugu').select('*').eq('user_id',currentUser.id).order('tarih',{ascending:false});
  const tbody=document.getElementById('hata-tbody'); tbody.innerHTML='';
  if (!data?.length) { tbody.innerHTML='<div class="item-empty">Henüz hata kaydı yok 🎉</div>'; return; }
  data.forEach((r,i)=>{
    const tekrar=r.tekrarlandi?'<span class="badge red">Tekrar</span>':'<span class="badge green">İlk</span>';
    const featured=i===0?' item-featured':'';
    const avatarBg=r.tekrarlandi?'linear-gradient(135deg,#e05050,#1e293b)':'linear-gradient(135deg,#50a060,#1e293b)';
    tbody.innerHTML+=`<div class="item-card${featured}"><div class="item-avatar" style="background:${avatarBg}">${(r.hata||'H').charAt(0).toUpperCase()}</div><div class="item-body"><div class="item-top"><span class="item-name">${r.hata||'—'}</span><span class="item-time">${fmtDate(r.tarih)}</span></div><div class="item-preview">${r.sebep||'Sebep belirtilmedi'}</div><div class="item-meta">${tekrar}${r.tekrarlandi?'<span class="item-critical">⚠️ Kritik</span>':''}${r.cozum?'<span class="item-cozum">💡 '+r.cozum+'</span>':''}</div></div><button class="delete-btn" onclick="deleteRecord('hata_gunlugu','${r.id}','hata')">✕</button></div>`;
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
