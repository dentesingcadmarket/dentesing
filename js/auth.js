function tokenUret() { return Math.random().toString(36).substring(2)+Date.now().toString(36); }
async function sessionKaydet() {
  mySessionToken = tokenUret();
  await sb.from('profiles').upsert({id:currentUser.id,session_token:mySessionToken});
}
async function sessionKontrol() {
  await sessionKaydet();
  sessionCheckInterval = setInterval(async () => {
    const {data} = await sb.from('profiles').select('session_token').eq('id',currentUser.id).single();
    if (!data || data.session_token !== mySessionToken) {
      clearInterval(sessionCheckInterval); await sb.auth.signOut(); showFunnel();
    }
  }, 30000);
  return true;
}

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
  // Modüle göre sidebar başlığını ve rengi ayarla
  if (modNo) {
    const modColors = {1:'#6ab0e8', 2:'#e8b840', 3:'#9b6dd0'};
    const modNames = {1:'Kariyer ve Yükseliş', 2:'Dijital Tasarım Temelleri', 3:'Freelance veya İşletme'};
    const icon = document.querySelector('.workspace-icon');
    if (icon) icon.style.background = 'linear-gradient(135deg, ' + (modColors[modNo]||'#4a90d9') + ', #1e293b)';
    const wname = document.querySelector('.workspace-name');
    if (wname) wname.textContent = 'Modül ' + modNo + ': ' + (modNames[modNo]||'');
  }
  // Modüle göre nav göster
  const mod2nav = document.getElementById('nav-mod2');
  const mod3nav = document.getElementById('nav-mod3');
  if (mod2nav) mod2nav.style.display = (modNo >= 2) ? 'block' : 'none';
  if (mod3nav) mod3nav.style.display = (modNo >= 3) ? 'block' : 'none';
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
  // Modülsüz giriş - lisanstan modül otomatik belirlenir
  document.getElementById('authModal').classList.add('open');
  document.getElementById('authModalTitle').textContent = 'Giriş Yap';
  document.getElementById('authModalSub').textContent = 'E-posta ve şifreni gir. Lisansına göre sistemin otomatik açılır.';
  document.getElementById('modalBuyBtn').textContent = '🛒 Lisans Satın Al';
  document.getElementById('modalBuyBtn').onclick = () => { window.open(BUY_LINKS[currentMod||1],'_blank'); };
}
function openModAuth() {
  // Modül detay sayfasından giriş - o modülün satın al linki gösterilir
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
async function handleModalAuth() {
  const email = document.getElementById('modalEmail').value.trim().toLowerCase();
  const password = document.getElementById('modalPassword').value;
  const btn = document.getElementById('modalAuthBtn');
  if (!email||!password) { showModalAuthError('E-posta ve şifre gerekli.'); return; }
  btn.textContent='Lütfen bekle...'; btn.disabled=true;

  // Lisans kontrolü - modul kolonunu da çek
  const {data:lisans,error:lisansHata} = await sb.from('lisanslar').select('aktif,modul').eq('email',email).single();
  if (!lisans||lisansHata) {
    btn.disabled=false; btn.textContent=modalAuthMode==='login'?'Giriş Yap':'Kayıt Ol';
    showModalAuthError('Bu e-posta lisanslı değil. Lütfen önce lisans satın alın.'); return;
  }
  if (!lisans.aktif) {
    btn.disabled=false; btn.textContent=modalAuthMode==='login'?'Giriş Yap':'Kayıt Ol';
    showModalAuthError('Lisansınız devre dışı bırakılmıştır.'); return;
  }

  let result;
  if (modalAuthMode==='login') result=await sb.auth.signInWithPassword({email,password});
  else result=await sb.auth.signUp({email,password});
  btn.disabled=false; btn.textContent=modalAuthMode==='login'?'Giriş Yap':'Kayıt Ol';

  if (result.error) { showModalAuthError(result.error.message); return; }
  if (modalAuthMode==='register') {
    if (!result.data.session) { showModalAuthError('Kayıt başarılı! E-postanı doğrula, sonra giriş yap.'); return; }
    currentUser=result.data.session.user; await sessionKaydet();
  } else {
    currentUser=result.data.session.user; await sessionKontrol();
  }
  closeAuthModal();

  // Lisanstaki modül bilgisine göre yönlendir
  // modul kolonu varsa kullan, yoksa 1 al
  userModule = lisans.modul || 1;
  const modNo = lisans.modul || currentMod || 1;
  currentMod = modNo;
  showApp(modNo);
}
function showModalAuthError(msg) { const el=document.getElementById('authModalError'); el.textContent=msg; el.classList.add('show'); }

async function handleSignOut() {
  clearInterval(sessionCheckInterval);
  if (currentUser) await sb.from('profiles').upsert({id:currentUser.id,session_token:null});
  await sb.auth.signOut(); currentUser=null; showFunnel();
  showToast('👋 Çıkış yapıldı.');
}
