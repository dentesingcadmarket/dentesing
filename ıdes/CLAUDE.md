# CLAUDE.md — Dentesing CAD Market

> Proje durumu belgesi. Her Claude oturumunda bu dosyayı oku.

---

## 1. Proje Ozeti

**Dentesing CAD Market** — Dis teknisyenleri icin AI destekli SaaS platformu.
Kullanicilar lisans satin alir, giris yapar ve modullerine gore farkli ozelliklere erisir.

Satici: Shopier uzerinden lisans satis. Lisans dogrulama Supabase `lisanslar` tablosu uzerinden yapilir.
Hedef kitle: Yeni mezun ve orta deneyimli dis teknisyenleri (Turkiye pazari).

---

## 2. Tech Stack

| Katman | Teknoloji |
|---|---|
| Frontend | Vanilla HTML + CSS + JS (framework yok) |
| Backend/DB | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| AI | Anthropic API (claude-sonnet-4-20250514, claude-haiku-4-5-20251001) |
| AI Proxy | Supabase Edge Function (`anthropic-proxy`) |
| Dosya Depolama | Supabase Storage — `is-gorselleri` bucket |
| Satis | Shopier (harici) |

---

## 3. Dosya Yapisi

```
ides/
  index.html                          # Ana SPA shell
  css/
    style.css                         # Tum stiller tek dosyada
  js/
    config.js                         # SUPABASE init, global degiskenler, MOD_DATA, init()
    auth.js                           # sessionKaydet/Kontrol, showFunnel/showApp, modal auth, signOut
    navigation.js                     # PAGE_MODULES, navigate(), kilit overlay, breadcrumbs
                                      #   + showApp/showFunnel/renderModDetail kopyalari (auth.js ile cakisma var)
    dashboard.js                      # loadDashboard, loadGunluk, loadHata, loadKarar, loadGelisim
                                      #   submitModal, deleteRecord, fmtDate, showToast
    agent.js                          # Dashboard agent: 5 sorulu onboarding, offline/online yol haritasi
    pierre.js                         # Pierre Fachuard chat (Modul 2): gorsel + STL destekli, geçmis localStorage
    vakalar.js                        # Vaka Pratikleri: Supabase'den cek, modal, Pierre entegrasyonu, puan sistemi
    asistan.js                        # Teknik Asistan chat: kullanici hata/gunluk verisini sistem promptuna inject eder
    yolharita.js                      # Yol Haritam: 6 sorulu onboard, 8 haftalik AI plan, gorev takibi, koç chat
  supabase/
    functions/
      anthropic-proxy/
        index.ts                      # Deno Edge Function: auth dogrula, Anthropic API'ye proxy
```

---

## 4. Modul Sistemi

Platform 3 modullu tier sistemiyle calisir:

| Modul | Renk | Baslik | Icerik |
|---|---|---|---|
| **Modul 1** | Mavi (#6ab0e8) | Kariyer ve Yukselis | Gunluk takip, hata radar, karar motoru, KPI, skor sistemi |
| **Modul 2** | Altin (#e8b840) | Dijital Tasarim Sistemi | CAD protokolleri, Pierre Fachuard AI, Vaka Pratikleri, Teknik Asistan |
| **Modul 3** | Mor (#9b6dd0) | Freelance veya Isletme | Fiyatlandirma, musteri yonetimi, gelir takibi (henuz gelistirilmedi) |

### Kilit Mekanizmasi

`navigation.js` icindeki `PAGE_MODULES` nesnesi hangi sayfanin hangi modulu gerektirdigini tanimlar:

```js
const PAGE_MODULES = {
  asistan: 2, pierre: 2, vakalar: 2,
  tasarim: 2, egzersiz: 2, fiyat: 2, musteri: 2
};
```

`navigate(page, el)` cagrildirinda `userModule < required` ise `showLockOverlay(required)` tetiklenir.
HTML'de `data-required-module="2"` attribute'u olan nav itemlara kilit ikonu eklenir.

---

## 5. Global Degiskenler

Tum dosyalar tarafindan paylasilan global scope degiskenleri:

| Degisken | Tanimlanan Yer | Aciklama |
|---|---|---|
| `sb` | config.js | Supabase istemci ornegi |
| `SUPABASE_URL` | config.js | `https://obcgthwywjdfrhfidvhd.supabase.co` |
| `SUPABASE_KEY` | config.js | Anon key (public) |
| `PROXY_URL` | config.js | `SUPABASE_URL + '/functions/v1/anthropic-proxy'` |
| `currentUser` | config.js | Supabase Auth kullanici nesnesi (null = cikis yapilmis) |
| `userModule` | config.js | Aktif kullanicinin modul numarasi (1, 2 veya 3) |
| `currentMod` | config.js | Funnel'da gosterilen modul (detay sayfasi icin) |
| `modalAuthMode` | config.js | 'login' veya 'register' |
| `mySessionToken` | config.js | Single-session kontrolu icin rastgele token |
| `sessionCheckInterval` | config.js | setInterval referansi (30s'de bir session kontrolu) |
| `gunlukFilter` | config.js | 'tumu', 'bugun' veya 'hafta' |
| `MOD_DATA` | config.js | Her modulu tanimlayan renk/icerik nesnesi |
| `BUY_LINKS` | config.js | Shopier satin al linkleri (modul 1/2/3) |

---

## 6. Supabase Tablolari

| Tablo | Kolonlar | Kullanan Dosya |
|---|---|---|
| `lisanslar` | email, aktif (bool), modul (int) | config.js, auth.js / navigation.js |
| `profiles` | id (user_id), session_token, vaka_puani | auth.js, navigation.js, vakalar.js |
| `gunluk_takip` | user_id, tarih, is_turu, sure, hata_sayisi, zorluk, not_, dosya_url | dashboard.js |
| `hata_gunlugu` | user_id, tarih, hata, sebep, cozum, tekrarlandi | dashboard.js |
| `karar_sistemi` | user_id, vaka_turu, cad_ayari, created_at | dashboard.js |
| `gelisim_takip` | localStorage'da tutulur (Supabase tablosu yok) | dashboard.js |
| `vakalar` | id, baslik, hasta_notu, klinisyen_notu, gorsel_url, zorluk, kategori, aktif, puan | vakalar.js |

**Storage:** `is-gorselleri` bucket — kullanici yuklenen PNG/JPG/STL dosyalari.
Path formati: `{user_id}/{timestamp}.{ext}`

---

## 7. API Proxy Akisi

```
Tarayici (js) --> PROXY_URL (Supabase Edge Function) --> api.anthropic.com
```

**Kritik kural:** Hicbir frontend dosyasi dogrudan `api.anthropic.com`'a istek yapmaz.
Her Anthropic cagrisi su yapidadir:

```js
const { data: { session } } = await sb.auth.getSession();
const res = await fetch(PROXY_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + session.access_token   // Supabase JWT
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: ...,
    system: ...,
    messages: [...]
  })
});
```

Edge Function (`index.ts`) su siradaki isi yapar:
1. Authorization header'i dogrula (Supabase auth.getUser ile)
2. Body'yi dogrudan `api.anthropic.com/v1/messages`'a ilet
3. Yaniti JSON olarak don

`ANTHROPIC_KEY` Supabase Edge Function env var'inda tutulur (istemci tarafinda asla yoktur).

### Kullanilan Modeller

| Modul/Ozellik | Model |
|---|---|
| Agent (Yol haritasi onboard) | claude-sonnet-4-20250514 |
| Pierre Fachuard (Modul 2 chat) | claude-sonnet-4-20250514 |
| Pierre (Vaka sorgusu) | claude-haiku-4-5-20251001 |
| Teknik Asistan | claude-sonnet-4-20250514 |
| Hata AI Analizi | claude-haiku-4-5-20251001 |
| Yol Haritam (8 haftalik plan) | claude-sonnet-4-20250514 |
| Yol Haritam (Koc chat) | claude-sonnet-4-20250514 |

---

## 8. Kritik Konvansiyonlar

### Auth Akisi

```
init() [config.js]
  --> sb.auth.getSession()
  --> lisanslar tablosundan modul cek
  --> sessionKontrol() [auth.js]
        --> sessionKaydet() (profiles tablosuna token yaz)
        --> setInterval 30s: token eslesmezse signOut + showFunnel()
  --> showApp(modNo)
        --> loadDashboard()
        --> initAgent()
```

### Single-Session Korumasi

`profiles.session_token` her giriste yenilenir. Baska bir tarayici giris yaparsa onceki session'daki 30s kontrolu token uyumsuzlugu tespit eder ve kullaniciya cikis yaptirir.

### Sayfa Navigasyonu

```js
navigate('asistan', el);
// --> PAGE_MODULES['asistan'] = 2
// --> userModule < 2 ise showLockOverlay(2) don
// --> degil ise: .page.active kaldir, #page-asistan'i aktif et
// --> initAsistan() cagir
```

### showApp / showFunnel Cakismasi

`showApp` ve `showFunnel` fonksiyonlari hem `auth.js` hem `navigation.js` icinde tanimlidir.
Script yukleme sirasina gore son yuklenen gecerli olur. Bu bilinen bir teknik borc.

### localStorage Anahtarlari

```
agent_state_{user.id}         -- agent.js: onboarding cevaplari + roadmap
pierre_history_v1             -- pierre.js: sohbet gecmisi (son 30 mesaj)
gelisim_{user.id}             -- dashboard.js: gelisim notlari
yolharita_v2_{user.id}        -- yolharita.js: 8 haftalik plan + gorev takibi
```

---

## 9. Sayfa Listesi (page-xxx ID'leri)

| Sayfa ID | Breadcrumb | Modul | Yuklenme Fonksiyonu |
|---|---|---|---|
| `page-dashboard` | Dashboard | 1 | `loadDashboard()` |
| `page-gunluk` | Gunluk Takip | 1 | `loadGunluk()` |
| `page-hata` | Hata Gunlugu | 1 | `loadHata()` |
| `page-karar` | Karar Sistemi | 1 | `loadKarar()` |
| `page-gelisim` | Gelisim Takibi | 1 | `loadGelisim()` |
| `page-yolharita` | Yol Haritam | 1 | `yhInit()` (navigation hook) |
| `page-rehber` | Nasil Kullanilir? | 1 | statik |
| `page-asistan` | Teknik Asistan | 2 | `initAsistan()` |
| `page-pierre` | Pierre Fachuard | 2 | `initPierre()` |
| `page-vakalar` | Vaka Pratikleri | 2 | `loadVakalar()` |
| `page-tasarim` | Tasarim Takibi | 2 | (henuz yok) |
| `page-egzersiz` | Hiz Egzersizleri | 2 | (henuz yok) |
| `page-fiyat` | Fiyatlandirma | 2 | (henuz yok) |
| `page-musteri` | Musteri Takip | 2 | (henuz yok) |

---

## 10. Teknik Borclar / Bilinen Kisitlamalar

1. **Fonksiyon cakismasi:** `showApp`, `showFunnel`, `renderModDetail`, `openLoginModal` vb. fonksiyonlar `auth.js` ve `navigation.js` icinde ikiser kez tanimlidir. Son yuklenen script kazanir.

2. **gelisim_takip tablosu yok:** Gelisim verisi Supabase'e degil localStorage'a yazilir. Cihaz degistirince veri kaybolur.

3. **Modul 2 sayfalari eksik:** `tasarim`, `egzersiz`, `fiyat`, `musteri` sayfalari `PAGE_MODULES`'de tanimli ama icerik HTML'i ve JS fonksiyonlari yazilmamis.

4. **Modul 3 tamamen placeholder:** `nav-mod3` gorunur ama hicbir sayfa aktif icerik sunmuyor.

5. **STL on-izleme yok:** STL dosyalari kaydedilir ama tarayicida gorsellestirilmez (sadece ikon gosterilir).

6. **Pierre history gorsel kaybi:** localStorage'a kaydedilirken gorsel base64 verisi yerine `[gorsel]` metni yazar — sohbet yenilenince gorseller kaybolur.

7. **Offline roadmap:** `agent.js` API basarisiz olursa kural bazli offline yol haritasi uretir, ancak bu durum kullaniciya belirtilmez.

---

## 11. Gelecek Sprint Plani

Kullanici talepleri ve eksik ozellikler:

- **Bülten modulu:** Platform duyurulari/icerik bolumu
- **Kutuphane modulu:** Teknik dokuman ve video arsivi
- **Freelancer katmani (Modul 3):** Fiyatlandirma hesaplayici, musteri CRM, gelir takibi
- **Tasarim Takibi sayfasi (Modul 2):** CAD calisma kaydi ve protokol takibi
- **Hiz Egzersizleri sayfasi (Modul 2):** Zamanlayici ve tekrar bazli pratik
- **gelisim_takip Supabase'e tasimak:** localStorage yerine kalici depolama
- **fonksiyon cakismasini cozme:** auth.js ve navigation.js'i birlestirme veya net ayirma
