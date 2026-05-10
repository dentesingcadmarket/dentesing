// ── SAYFA MODÜLLERİ ──
const PAGE_MODULES = {
  terminal: 2, vakalar: 2,
  tasarim: 2, egzersiz: 2, fiyat: 2, musteri: 2
};

// ── EKRAN YÖNETİMİ ──
function showFunnel() {
  document.getElementById('funnel').style.display = 'block';
  document.getElementById('mod-detail').style.display = 'none';
  document.getElementById('app').classList.remove('show');
}
function showApp(modNo) {
  document.getElementById('funnel').style.display = 'none';
  document.getElementById('mod-detail').style.display = 'none';
  document.getElementById('app').classList.add('show');
  document.getElementById('userEmail').textContent = currentUser?.email || '';
  if (modNo) {
    const modColors = {1:'#6ab0e8', 2:'#e8b840', 3:'#9b6dd0'};
    const modNames = {1:'Kariyer ve Yükseliş', 2:'Dijital Tasarım Sistemi', 3:'Freelance veya İşletme'};
    const icon = document.querySelector('.workspace-icon');
    if (icon) icon.style.background = 'linear-gradient(135deg, ' + (modColors[modNo]||'#4a90d9') + ', #1e293b)';
    const wname = document.querySelector('.workspace-name');
    if (wname) wname.textContent = 'Modül ' + modNo + ': ' + (modNames[modNo]||'');
  }
  // Kilitli nav itemlara kilit ikonu ekle
  document.querySelectorAll('.nav-item[data-required-module]').forEach(item => {
    const req = parseInt(item.dataset.requiredModule);
    const lockIcon = item.querySelector('.nav-lock');
    if (userModule < req) {
      item.classList.add('nav-locked');
      if (!lockIcon) {
        const s = document.createElement('span');
        s.className = 'nav-lock';
        s.textContent = '🔒';
        item.appendChild(s);
      }
    } else {
      item.classList.remove('nav-locked');
      if (lockIcon) lockIcon.remove();
    }
  });
  // Eski gizleme kaldırıldı - nav-mod2 ve nav-mod3 her zaman göster
  const mod2nav = document.getElementById('nav-mod2');
  const mod3nav = document.getElementById('nav-mod3');
  if (mod2nav) mod2nav.style.display = 'block';
  if (mod3nav) mod3nav.style.display = 'block';
  loadDashboard();
}
function showModDetail(num) {
  currentMod = num;
  document.getElementById('funnel').style.display = 'none';
  document.getElementById('mod-detail').style.display = 'block';
  document.getElementById('app').classList.remove('show');
  renderModDetail(num);
  window.scrollTo(0,0);
}
function backToFunnel() {
  document.getElementById('funnel').style.display = 'block';
  document.getElementById('mod-detail').style.display = 'none';
}
function scrollToModules() {
  document.getElementById('modules-section').scrollIntoView({behavior:'smooth'});
}

// ── MODÜL DETAY RENDER ──
function renderModDetail(num) {
  const m = MOD_DATA[num];
  const featureHTML = m.features.map(f=>`
    <div class="md-feature">
      <div class="md-feature-icon">${f.icon}</div>
      <div><div class="md-feature-title">${f.title}</div><div class="md-feature-text">${f.text}</div></div>
    </div>`).join('');

  document.getElementById('md-content').innerHTML = `
    <div class="md-hero">
      <div class="md-mod-badge" style="background:${m.badgeBg};border:1px solid ${m.badgeBorder};color:${m.color}">${m.num}</div>
      <div class="md-title" style="color:${m.color}">${m.title}</div>
      <div class="md-tagline">${m.tagline}</div>
      <div class="md-cta-row">
        <button class="md-btn-buy" style="background:${m.colorGrad};color:#fff;box-shadow:0 6px 24px ${m.colorSoft}" onclick="openBuyLink()">🛒 Lisans Satın Al</button>
        <button class="md-btn-login" onclick="openModAuth()">Giriş Yap / Kayıt Ol</button>
      </div>
    </div>
    <div class="md-blocks">
      <div class="md-block">
        <div class="md-block-title">❌ Problem</div>
        <div class="md-block-text">${m.problem}</div>
      </div>
      <div class="md-block">
        <div class="md-block-title">✅ Çözüm</div>
        <div class="md-block-text">${m.solution}</div>
      </div>
    </div>
    <div style="font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);margin-bottom:14px;">Bu Modülde Ne Var?</div>
    <div class="md-features">${featureHTML}</div>
    <div style="background:var(--surface);border:1px solid ${m.badgeBorder};border-radius:14px;padding:32px;text-align:center;margin-top:16px;">
      <div style="font-size:22px;font-weight:800;margin-bottom:8px;color:${m.color}">${m.title}</div>
      <div style="font-size:14px;color:var(--text2);margin-bottom:24px">Lisansını al, hemen başla.</div>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <button class="md-btn-buy" style="background:${m.colorGrad};color:#fff;box-shadow:0 6px 24px ${m.colorSoft}" onclick="openBuyLink()">🛒 Lisans Satın Al</button>
        <button class="md-btn-login" onclick="openModAuth()">Giriş Yap</button>
      </div>
    </div>
  `;
}

// ── AUTH MODAL ──
function openNavLogin() { openLoginModal(); }
function openLoginModal() {
  document.getElementById('authModal').classList.add('open');
  document.getElementById('authModalTitle').textContent = 'Giriş Yap';
  document.getElementById('authModalSub').textContent = 'E-posta ve şifreni gir. Lisansına göre sistemin otomatik açılır.';
  document.getElementById('modalBuyBtn').textContent = '🛒 Lisans Satın Al';
  document.getElementById('modalBuyBtn').onclick = () => { window.open(BUY_LINKS[currentMod||1],'_blank'); };
}
function openModAuth() {
  document.getElementById('authModal').classList.add('open');
  document.getElementById('authModalTitle').textContent = 'Giriş Yap';
  document.getElementById('authModalSub').textContent = 'E-posta ve şifreni gir. Lisansına göre sistemin otomatik açılır.';
  document.getElementById('modalBuyBtn').textContent = `🛒 Modül ${currentMod} Lisansını Al`;
  document.getElementById('modalBuyBtn').onclick = () => openBuyLink();
}
function openAuthModal() { openLoginModal(); }
function closeAuthModal() { document.getElementById('authModal').classList.remove('open'); }
function openBuyLink() { window.open(BUY_LINKS[currentMod], '_blank'); }

function switchModalTab(mode) {
  modalAuthMode = mode;
  document.querySelectorAll('.md-auth-tab').forEach((t,i) => {
    t.classList.toggle('active',(mode==='login'&&i===0)||(mode==='register'&&i===1));
  });
  document.getElementById('modalAuthBtn').textContent = mode==='login'?'Giriş Yap':'Kayıt Ol';
  document.getElementById('authModalError').classList.remove('show');
}

async function handleSignOut() {
  clearInterval(sessionCheckInterval);
  if (currentUser) await sb.from('profiles').upsert({id:currentUser.id,session_token:null});
  await sb.auth.signOut(); currentUser=null; showFunnel();
  showToast('👋 Çıkış yapıldı.');
}

// ── KILIT OVERLAY ──
function showLockOverlay(requiredMod) {
  const overlay = document.getElementById('lock-overlay');
  if (!overlay) return;
  overlay.querySelector('.lock-mod-text').textContent = `Bu özellik Modül ${requiredMod}'de mevcut`;
  overlay.querySelector('.lock-upgrade-btn').onclick = () => window.open(BUY_LINKS[requiredMod] || BUY_LINKS[2], '_blank');
  overlay.classList.add('open');
}
function closeLockOverlay() {
  const overlay = document.getElementById('lock-overlay');
  if (overlay) overlay.classList.remove('open');
}

// ── APP NAVİGASYON ──
const breadcrumbs = {
  dashboard:'Dashboard', gunluk:'Günlük Takip', hata:'Hata Günlüğü',
  tasarim:'Tasarım Takibi', egzersiz:'Hız Egzersizleri',
  fiyat:'Fiyatlandırma', musteri:'Müşteri Takip', rehber:'Nasıl Kullanılır?',
  gelisim:'Gelişim Takibi', yolharita:'Yol Haritam',
  terminal:'Terminal', vakalar:'Vaka Pratikleri'
};

function navigate(page, el) {
  // Kilit kontrolü
  const required = PAGE_MODULES[page] || 1;
  if (userModule < required) {
    showLockOverlay(required);
    return;
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pageEl = document.getElementById('page-' + page);
  if (!pageEl) return;
  pageEl.classList.add('active');
  if (el) el.classList.add('active');
  document.getElementById('breadcrumb').innerHTML = `D·CONSOLE › <span>${breadcrumbs[page] || page}</span>`;
  if (page === 'dashboard') loadDashboard();
  if (page === 'gunluk') loadGunluk();
  if (page === 'hata') loadHata();
  if (page === 'gelisim') loadGelisim();
  if (page === 'terminal') initTerminal();
  if (page === 'vakalar') loadVakalar();
}
