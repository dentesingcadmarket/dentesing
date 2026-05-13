let _tlkFilter = 'hepsi';
let _tlkPostDosya = null;
let _tlkAcikPost = null;

async function loadTopluluk() {
  const container = document.getElementById('tlk-feed');
  if (!container) return;
  container.innerHTML = '<div class="item-empty">Yükleniyor...</div>';

  let query = sb.from('topluluk_posts')
    .select('*, topluluk_yorumlar(count)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (_tlkFilter !== 'hepsi') {
    query = query.eq('kategori', _tlkFilter);
  }

  const { data, error } = await query;

  if (error || !data?.length) {
    container.innerHTML = '<div class="item-empty">Henüz gönderi yok. İlk gönderiyi sen paylaş! 👆</div>';
    return;
  }

  container.innerHTML = data.map(p => _tlkPostCard(p)).join('');
}

function _tlkPostCard(p) {
  const avatar = (p.display_name || 'U')[0].toUpperCase();
  const tarih = new Date(p.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  const yorumSayisi = p.topluluk_yorumlar?.[0]?.count ?? 0;
  const isOwner = currentUser && p.user_id === currentUser.id;

  let dosyaHtml = '';
  if (p.dosya_tip === 'gorsel' && p.dosya_url) {
    dosyaHtml = `<img class="post-thumb-img" src="${p.dosya_url}" alt="görsel">`;
  } else if (p.dosya_tip === 'stl' && p.dosya_url) {
    const stlAd = p.dosya_url.split('/').pop().split('?')[0];
    dosyaHtml = `<div class="post-thumb-stl">🔧 ${_esc(stlAd)}</div>`;
  }

  return `
    <div class="item-card post-card" onclick="openPostDetay('${p.id}')">
      <div class="item-avatar" style="background:linear-gradient(135deg,#1e4fa3,#2a6fc0);flex-shrink:0">${avatar}</div>
      <div class="item-body">
        <div class="item-top">
          <span class="item-name">${_esc(p.display_name || 'Kullanıcı')}</span>
          <span class="item-time">${tarih}</span>
        </div>
        <div class="post-baslik">${_esc(p.baslik)}</div>
        ${p.icerik ? `<div class="item-preview">${_esc(p.icerik.slice(0, 120))}${p.icerik.length > 120 ? '…' : ''}</div>` : ''}
        ${dosyaHtml}
        <div class="item-meta" style="margin-top:8px">
          <span class="post-meta-btn" onclick="event.stopPropagation();_begeniPost('${p.id}',this)">❤️ ${p.begeni_sayisi || 0}</span>
          <span class="post-meta-btn">💬 ${yorumSayisi}</span>
          ${isOwner ? `<span class="post-meta-btn post-sil-btn" onclick="event.stopPropagation();_deletePost('${p.id}')">🗑️</span>` : ''}
        </div>
      </div>
    </div>`;
}

function _esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function tlkSetFilter(f, el) {
  _tlkFilter = f;
  document.querySelectorAll('.tlk-filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  loadTopluluk();
}

// ── Yeni Gönderi ────────────────────────────────────────────

function openYeniPost() {
  _tlkPostDosya = null;
  document.getElementById('tlk-post-baslik').value = '';
  document.getElementById('tlk-post-icerik').value = '';
  document.getElementById('tlk-post-dosya').value = '';
  document.getElementById('tlk-post-attach').innerHTML = '';
  document.getElementById('modal-yeni-post').classList.add('open');
}

function closeYeniPost() {
  document.getElementById('modal-yeni-post').classList.remove('open');
}

function tlkDosyaSecildi(input) {
  if (!input.files?.[0]) return;
  const file = input.files[0];
  const isStl = file.name.toLowerCase().endsWith('.stl');
  _tlkPostDosya = { file, isStl };
  const chip = document.getElementById('tlk-post-attach');
  chip.innerHTML = `<div class="terminal-attach-chip">
    <span>${isStl ? '🔧' : '🖼️'} ${_esc(file.name)}</span>
    <button onclick="_tlkPostDosya=null;document.getElementById('tlk-post-dosya').value='';document.getElementById('tlk-post-attach').innerHTML=''">×</button>
  </div>`;
}

async function submitPost() {
  const baslik = document.getElementById('tlk-post-baslik').value.trim();
  const icerik = document.getElementById('tlk-post-icerik').value.trim();
  if (!baslik) { showToast('❌ Başlık boş olamaz'); return; }

  const btn = document.getElementById('tlk-post-save');
  btn.disabled = true; btn.textContent = 'Gönderiliyor…';

  try {
    let dosyaUrl = null, dosyaTip = null;
    if (_tlkPostDosya?.file) {
      const { file, isStl } = _tlkPostDosya;
      const ext = file.name.split('.').pop().toLowerCase();
      const path = `topluluk/${currentUser.id}/${Date.now()}.${ext}`;
      const { data: upData, error: upErr } = await sb.storage.from('is-gorselleri').upload(path, file);
      if (!upErr && upData) {
        const { data: urlData } = sb.storage.from('is-gorselleri').getPublicUrl(path);
        dosyaUrl = urlData?.publicUrl || null;
        dosyaTip = isStl ? 'stl' : 'gorsel';
      }
    }

    const { error } = await sb.from('topluluk_posts').insert({
      user_id: currentUser.id,
      display_name: currentUser.email.split('@')[0],
      baslik,
      icerik: icerik || null,
      dosya_url: dosyaUrl,
      dosya_tip: dosyaTip
    });
    if (error) throw error;

    showToast('✅ Gönderi paylaşıldı!');
    closeYeniPost();
    loadTopluluk();
  } catch(e) {
    showToast('❌ Hata: ' + e.message);
  }

  btn.disabled = false; btn.textContent = 'Paylaş';
}

async function _deletePost(id) {
  if (!confirm('Gönderiyi silmek istediğine emin misin?')) return;
  await sb.from('topluluk_posts').delete().eq('id', id);
  showToast('🗑️ Gönderi silindi');
  loadTopluluk();
}

async function _begeniPost(id, el) {
  const { data } = await sb.from('topluluk_posts').select('begeni_sayisi').eq('id', id).single();
  const yeni = (data?.begeni_sayisi || 0) + 1;
  await sb.from('topluluk_posts').update({ begeni_sayisi: yeni }).eq('id', id);
  el.textContent = `❤️ ${yeni}`;
}

// ── Post Detay ───────────────────────────────────────────────

async function openPostDetay(id) {
  _tlkAcikPost = id;
  const modal = document.getElementById('modal-post-detay');
  modal.classList.add('open');
  document.getElementById('tlk-detay-body').innerHTML = '<div class="item-empty">Yükleniyor…</div>';
  document.getElementById('tlk-yorum-input').value = '';

  const [{ data: post }, { data: yorumlar }] = await Promise.all([
    sb.from('topluluk_posts').select('*').eq('id', id).single(),
    sb.from('topluluk_yorumlar').select('*').eq('post_id', id).order('created_at', { ascending: true })
  ]);

  if (!post) { modal.classList.remove('open'); return; }

  const avatar = (post.display_name || 'U')[0].toUpperCase();
  const tarih = new Date(post.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });

  let dosyaHtml = '';
  if (post.dosya_tip === 'gorsel' && post.dosya_url) {
    dosyaHtml = `<img src="${post.dosya_url}" style="width:100%;max-height:320px;object-fit:cover;border-radius:8px;margin:12px 0;display:block">`;
  } else if (post.dosya_tip === 'stl' && post.dosya_url) {
    const stlAd = post.dosya_url.split('/').pop().split('?')[0];
    dosyaHtml = `<div class="post-thumb-stl" style="margin:12px 0">🔧 ${_esc(stlAd)}</div>`;
  }

  const yorumHtml = (yorumlar || []).map(y => {
    const yAvatar = (y.display_name || 'U')[0].toUpperCase();
    const yTarih = new Date(y.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    const isOwner = currentUser && y.user_id === currentUser.id;
    return `<div class="yorum-item">
      <div class="yorum-avatar">${yAvatar}</div>
      <div class="yorum-body">
        <div class="yorum-meta"><strong>${_esc(y.display_name || 'Kullanıcı')}</strong><span>${yTarih}</span></div>
        <div class="yorum-text">${_esc(y.icerik)}</div>
      </div>
      ${isOwner ? `<button class="yorum-sil" onclick="deleteYorum('${y.id}')">×</button>` : ''}
    </div>`;
  }).join('');

  document.getElementById('tlk-detay-body').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
      <div class="item-avatar" style="background:linear-gradient(135deg,#1e4fa3,#2a6fc0);flex-shrink:0">${avatar}</div>
      <div>
        <div style="font-weight:600;font-size:14px;color:var(--text)">${_esc(post.display_name || 'Kullanıcı')}</div>
        <div style="font-size:11px;color:var(--text3)">${tarih}</div>
      </div>
    </div>
    <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:8px">${_esc(post.baslik)}</div>
    ${post.icerik ? `<div style="font-size:13px;color:var(--text2);line-height:1.7">${_esc(post.icerik)}</div>` : ''}
    ${dosyaHtml}
    <div style="border-top:1px solid var(--border);margin:16px 0 10px;padding-top:10px;font-size:11px;font-weight:600;color:var(--text3);letter-spacing:.05em">
      YORUMLAR${yorumlar?.length ? ` (${yorumlar.length})` : ''}
    </div>
    ${yorumHtml || '<div style="font-size:12px;color:var(--text3);padding:6px 0">Henüz yorum yok. İlk yorumu sen yap!</div>'}
  `;
}

function closePostDetay() {
  document.getElementById('modal-post-detay').classList.remove('open');
  _tlkAcikPost = null;
}

async function submitYorum() {
  if (!_tlkAcikPost) return;
  const icerik = document.getElementById('tlk-yorum-input').value.trim();
  if (!icerik) return;

  const btn = document.getElementById('tlk-yorum-save');
  btn.disabled = true;

  try {
    const { error } = await sb.from('topluluk_yorumlar').insert({
      post_id: _tlkAcikPost,
      user_id: currentUser.id,
      display_name: currentUser.email.split('@')[0],
      icerik
    });
    if (error) throw error;
    document.getElementById('tlk-yorum-input').value = '';
    await openPostDetay(_tlkAcikPost);
    showToast('💬 Yorum eklendi');
  } catch(e) {
    showToast('❌ ' + e.message);
  }

  btn.disabled = false;
}

async function deleteYorum(id) {
  await sb.from('topluluk_yorumlar').delete().eq('id', id);
  if (_tlkAcikPost) await openPostDetay(_tlkAcikPost);
}
