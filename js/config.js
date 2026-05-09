// ── SUPABASE ──
const SUPABASE_URL = 'https://obcgthwywjdfrhfidvhd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iY2d0aHd5d2pkZnJoZmlkdmhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyODE5MzksImV4cCI6MjA5Mjg1NzkzOX0.ba7VzpMlNOD1_yujBNmSs-Jk5lEJMEvhZ4YQbaphG4Y';
const PROXY_URL = SUPABASE_URL + '/functions/v1/anthropic-proxy';
const {createClient} = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── MODÜL DATA ──
const BUY_LINKS = {
  1:'https://www.shopier.com/dentesingcadmarket/43669668',
  2:'https://www.shopier.com/dentesingcadmarket/43674703',
  3:'https://www.shopier.com/dentesingcadmarket/43787542'
};
const MOD_DATA = {
  1:{
    color:'var(--m1b)', colorSoft:'rgba(74,144,217,0.12)', colorGrad:'linear-gradient(135deg,#1e4fa3,#2a6fc0)',
    badgeBg:'rgba(74,144,217,0.15)', badgeBorder:'rgba(74,144,217,0.4)',
    num:'Modül 01 — Temel', title:'Kariyer ve Yükseliş',
    tagline:'Saha pratiğini sisteme çevir. AI destekli yol haritası, hata radarı ve skor sistemi ile fark yarat.',
    problem:'Yeni mezunsun ama sahada kimse sana gerçeği söylemiyor. Yavaşsın, hata yapıyorsun ve "doğru mu yapıyorum?" sorusu hiç bitmiyor.',
    solution:'Modül 1, günlük çalışmanı sisteme çevirir. Ne yaptığını kaydedersin, hataları takip edersin, zamanla nasıl geliştiğini rakamlarla görürsün.',
    features:[
      {icon:'📅',title:'Günlük İş Takibi',text:'Her vakayı kaydet. Süre, zorluk, hata sayısı — hepsi görünür hale gelir.'},
      {icon:'⚠️',title:'Hata Radarı',text:'Aynı hatayı iki kez yaparsan sistem seni uyarır. Tekrar eden hata = kritik.'},
      {icon:'🧠',title:'Karar Motoru',text:'Estetik mi, fonksiyon mu? Materyal ve kalınlık otomatik önerilir.'},
      {icon:'📊',title:'KPI ve Hız Analizi',text:'Hedef süre vs gerçek süre. Hangi iş türünde yavaşsın? Sistem söyler.'},
      {icon:'🧬',title:'Skor Sistemi',text:'Her temiz gün puan kazanırsın. Seviyeni yükselt: Başlangıç → Güvenilir.'},
      {icon:'🎯',title:'Günlük Görev Motoru',text:'Bugün 3 iş, 1 karar, 1 hata kontrolü. Tamamlanma yüzdesi canlı görünür.'}
    ]
  },
  2:{
    color:'var(--m2b)', colorSoft:'rgba(232,184,64,0.12)', colorGrad:'linear-gradient(135deg,#8a6000,#c89820)',
    badgeBg:'rgba(232,184,64,0.15)', badgeBorder:'rgba(232,184,64,0.4)',
    num:'Modül 02 — Asıl Güç', title:'Dijital Tasarım Sistemi',
    tagline:'CAD yazılımında hızlan, protokol kur, rakipten ayrış. Modül 1 üzerine inşa edilir.',
    problem:'Exocad ya da 3Shape ile YouTube videolarından öğrenmeye çalışıyorsun. Ne öğrendiğini bilmiyorsun, ne kadar iyi olduğunu bilmiyorsun, nereye gittiğini bilmiyorsun.',
    solution:'Modül 2 sana yapılandırılmış bir öğrenme yolu verir. Protokol var, egzersiz var, haftalık ilerleme takibi var.',
    features:[
      {icon:'🖥️',title:'Yazılım Temelleri',text:'Exocad ve 3Shape temellerini sistematik öğren.'},
      {icon:'📐',title:'Tasarım Protokolleri',text:'Her vaka türü için adım adım tasarım protokolü.'},
      {icon:'⚡',title:'Hız Egzersizleri',text:'Aynı vakayı daha hızlı yapmak için tekrar bazlı alıştırmalar.'},
      {icon:'🎯',title:'Vaka Pratikleri',text:'Gerçek vaka senaryoları üzerinden pratik çalışmalar.'},
      {icon:'📋',title:'Haftalık Takip',text:'Bu hafta ne öğrendin? Ne hızlandı? Sistem sana söyler.'},
      {icon:'🏆',title:'Yetkinlik Seviyeleri',text:'Başlangıç seviyesinden İleri seviyeye kadar ölçülebilir sistem.'}
    ]
  },
  3:{
    color:'var(--m3b)', colorSoft:'rgba(155,109,208,0.12)', colorGrad:'linear-gradient(135deg,#4a1a7a,#7a3dbd)',
    badgeBg:'rgba(155,109,208,0.15)', badgeBorder:'rgba(155,109,208,0.4)',
    num:'Modül 03', title:'Freelance veya İşletme',
    tagline:'Freelance çalışmak veya kendi işletmeni kurmak için eksiksiz altyapı. Fiyat ver, müşteri yönet, büyü.',
    problem:'Teknik olarak iyisin ama iş geliştirme bilmiyorsun. Ne kadar fiyat vereceğini bilmiyorsun, nasıl müşteri bulacağını bilmiyorsun, nasıl büyüyeceğini bilmiyorsun.',
    solution:'Modül 3, sana hem freelance hem de küçük işletme kurmanın sistemini verir. Fiyatlandırmadan müşteri yönetimine, stüdyo kurulumundan büyüme stratejisine kadar her adım burada.',
    features:[
      {icon:'💼',title:'Fiyatlandırma Sistemi',text:'İş türüne göre doğru fiyat nasıl hesaplanır? Teklif şablonu hazır.'},
      {icon:'🤝',title:'Müşteri Yönetimi',text:'Müşteri takip protokolü, iletişim şablonları, sorun çözme rehberi.'},
      {icon:'📦',title:'Stüdyo Kurulum',text:'Minimal bütçeyle doğru ekipman seçimi. Sıfırdan kurulum rehberi.'},
      {icon:'💰',title:'Gelir Takibi',text:'Aylık gelir, gider, net kazanç. Rakamları görünür yap.'},
      {icon:'📣',title:'Müşteri Bulma',text:'Instagram, ağız yolu, hekim ağı. Doğru kanallar ve mesajlar.'},
      {icon:'🚀',title:'Büyüme Stratejisi',text:'Tek kişilik stüdyodan ekipli işletmeye geçiş yol haritası.'}
    ]
  }
};

let currentMod = 1;
let userModule = 1;
let modalAuthMode = 'login';
let currentUser = null;
let currentModal = '';
let gunlukFilter = 'tumu';
let mySessionToken = null;
let sessionCheckInterval = null;

// ── SUPABASE INIT ──
async function init() {
  const {data:{session}} = await sb.auth.getSession();
  if (session) {
    currentUser = session.user;
    // Lisans modülünü çek
    const {data:lis} = await sb.from('lisanslar').select('aktif,modul').eq('email',currentUser.email).single();
    if (lis) { userModule = lis.modul || 1; currentMod = userModule; }
    const gecerli = await sessionKontrol();
    if (gecerli) { showApp(userModule); }
    else { await sb.auth.signOut(); showFunnel(); }
  } else { showFunnel(); }
  document.getElementById('loading').classList.add('hide');
  sb.auth.onAuthStateChange(async (event, session) => {
    if (!session) { currentUser = null; userModule = 1; clearInterval(sessionCheckInterval); }
  });
}
