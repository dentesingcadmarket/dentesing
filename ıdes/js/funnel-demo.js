// Funnel Demo — Pierre Fachuard AI Chat Animasyonu
// 3 dental senaryo arası otomatik geçiş, 12 saniyede bir döner

const DEMO_SCRIPTS = [
  [
    { role: 'user', text: 'Zirkonyum köprüde oklüzal uyum sorunu var. Tekrar yapacak mıyım?' },
    { role: 'ai',   text: 'Köprüyü yenilemeden önce refinement protokolünü deneyelim. Önce statik oklüzyonu kontrol edin — tüm birimler eşit temas kurmalı. Sonra lateral ve protrusiv hareketlerde prematür kontakları işaretleyin. Genellikle %80 vakada yeniden üretim gerekmez.' }
  ],
  [
    { role: 'user', text: 'Bu ay 14 vaka tamamladım ama hata oranım hâlâ yüksek.' },
    { role: 'ai',   text: 'Kayıtlarınızı inceledim — hataların %68\'i preparasyon scan aşamasında oluşuyor. İki öneri: Tarama açısını 15-20° değiştirin ve yüzeyi optik pudra ile matlaştırın. Bu değişikliklerle hata oranınızı yarıya indirebilirsiniz.' }
  ],
  [
    { role: 'user', text: 'Exocad\'da full arch implant vakasında emergence profile nasıl ayarlamalıyım?' },
    { role: 'ai',   text: 'Full arch için emergence profile kritik. Anterior bölgede 30-35°, posterior bölgede 25-30° konveksite idealdir. Design modülünde Gingival Adaption → Emergence Shape yolunu kullanın. Soft tissue basıncı hafif pozitif kalmalı — bu hem estetiği hem hijyeni iyileştirir.' }
  ]
];

let demoIndex = 0;
let demoTimer = null;
let isRunning = false;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function appendMsg(container, role, text) {
  const msg = document.createElement('div');
  msg.className = 'f-demo-msg ' + role;
  const bubble = document.createElement('div');
  bubble.className = 'f-demo-bubble';
  bubble.textContent = text;
  msg.appendChild(bubble);
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function showTyping(container) {
  const typing = document.createElement('div');
  typing.className = 'f-demo-msg ai';
  typing.id = 'demo-typing-indicator';
  const bubble = document.createElement('div');
  bubble.className = 'f-demo-bubble f-demo-typing';
  bubble.innerHTML = '<span></span><span></span><span></span>';
  typing.appendChild(bubble);
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;
  return typing;
}

async function runDemoScript() {
  const container = document.getElementById('demo-messages');
  if (!container || isRunning) return;
  isRunning = true;

  const script = DEMO_SCRIPTS[demoIndex];

  // Fade out old messages
  container.style.opacity = '0';
  container.style.transition = 'opacity 0.4s ease';
  await sleep(400);
  container.innerHTML = '';
  container.style.opacity = '1';

  await sleep(600);

  // Show user message
  appendMsg(container, 'user', script[0].text);
  await sleep(900);

  // Show typing indicator
  const typingEl = showTyping(container);
  await sleep(1800);

  // Remove typing, show AI response
  typingEl.remove();
  appendMsg(container, 'ai', script[1].text);

  isRunning = false;
}

function initFunnelDemo() {
  const container = document.getElementById('demo-messages');
  if (!container) return;

  runDemoScript();

  demoTimer = setInterval(async () => {
    demoIndex = (demoIndex + 1) % DEMO_SCRIPTS.length;
    await runDemoScript();
  }, 12000);
}

// Intersection Observer — sadece görünürken çalıştır
function startDemoWhenVisible() {
  const section = document.getElementById('demo-section');
  if (!section) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !demoTimer) {
          initFunnelDemo();
        }
      });
    }, { threshold: 0.2 });
    observer.observe(section);
  } else {
    initFunnelDemo();
  }
}

document.addEventListener('DOMContentLoaded', startDemoWhenVisible);
