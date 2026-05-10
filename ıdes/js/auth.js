// ── SESSION YÖNETİMİ ──
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

// ── AUTH MODAL ──
async function handleModalAuth() {
  const email = document.getElementById('modalEmail').value.trim().toLowerCase();
  const password = document.getElementById('modalPassword').value;
  const btn = document.getElementById('modalAuthBtn');
  if (!email||!password) { showModalAuthError('E-posta ve şifre gerekli.'); return; }
  btn.textContent='Lütfen bekle...'; btn.disabled=true;

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

  userModule = lisans.modul || 1;
  currentMod = userModule;
  showApp(userModule);
}
function showModalAuthError(msg) { const el=document.getElementById('authModalError'); el.textContent=msg; el.classList.add('show'); }
