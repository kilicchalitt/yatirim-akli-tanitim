# Mimari

Bu belge Yatırım Aklı'nın nasıl kurulduğunu üst düzeyde anlatır. Uygulamanın kaynak kodu özeldir; burada katmanlar, veri akışları ve aralarındaki sözleşmeler yer alır. Kararların gerekçeleri [DECISIONS.md](DECISIONS.md) içindedir (`D-xx` numaraları ana projedekiyle aynıdır).

## Genel görünüm

```
                 İnternet (80/443)
                        │
                ┌───────▼───────┐   canlıda: otomatik TLS sertifikası,
                │ Ters vekil    │   HTTP→HTTPS, HSTS
                └───────┬───────┘
                        │ iç ağ
                ┌───────▼───────┐
                │ nginx         │   React derlemesi (SPA) + /api ters vekil,
                │               │   CSP ve güvenlik başlıkları
                └───────┬───────┘
                        │ /api
                ┌───────▼───────┐        ┌──────────────────────────┐
                │ FastAPI       │───────►│ Google Gemini (AI)       │
                │ (async)       │───────►│ Yahoo Finance / yfinance │
                │               │───────►│ RSS haber kaynakları     │
                └───────┬───────┘        └──────────────────────────┘
                        │
                ┌───────▼───────┐
                │ PostgreSQL 16 │   şema yalnızca Alembic migration'larıyla
                └───────────────┘
```

- Frontend ve API **aynı origin'den** sunulur (nginx `/api` ters vekili), bu yüzden tarayıcı tarafında CORS pratikte devreye girmez (D-10).
- Backend ve PostgreSQL hiçbir ortamda host'a açılmaz; dışarıdan yalnızca web sunucusuna ulaşılır.
- Gemini anahtarı yalnızca sunucuda bulunur; tarayıcıya hiçbir zaman gönderilmez.

## Backend katmanları

```
api/        HTTP sınırı: doğrulama, sahiplik kontrolü, hız sınırı bağımlılıkları
  │
services/   iş mantığı (portföy, işlem, analiz, AI, alarm, bildirim, haber)
  │
utils/      saf hesaplar ve ortak araçlar (finans, para birimi, sembol, önbellek, mesaj kataloğu)
  │
models/     SQLAlchemy 2 (async) modelleri  ──►  Alembic migration'ları
```

Temel kurallar:

- **Yükleme ile hesaplama ayrıdır (D-14).** Servisler önce veritabanından yükler, sonra hesaplamayı session'a dokunmayan saf fonksiyonlarda yapar. Paralel çalışan hesaplar (dağılım, risk, performans) bu sayede aynı session'ı paylaşmaz.
- **Piyasa verisine tek kapıdan gidilir (D-15).** Hiçbir servis yfinance'i doğrudan çağırmaz; tek bir erişim katmanı thread'de çalıştırma, süreli önbellek (TTL) ve aynı anahtar için istek birleştirme yapar.
- **Pozisyonlar işlemlerden türetilir (D-07).** Lot ve ortalama maliyet elle yazılmaz; her işlem eklendiğinde ya da silindiğinde o hissenin tüm geçmişi yeniden oynatılır. Bakiyeyi tutarsız bırakacak işlemler reddedilir.
- **Para birimi (D-18, D-40).** Her portföyün kendi para birimi vardır; farklı para birimli hisseler güncel kurla çevrilir. Pence gibi küçük birimler piyasa verisi katmanında ana birime çevrilir.
- **Dil (D-39).** İstek dili `Accept-Language` başlığından, giriş yapılmışsa hesaptan gelir; hata mesajları, bildirimler ve AI yanıtları bu dilde üretilir.

## Veri modeli

```
User 1─* Portfolio 1─* PortfolioStock 1─* Transaction
User 1─* PriceAlert         Portfolio 1─* AiAnalysis
User 1─* Notification *─0..1 PriceAlert
User 1─* WatchlistItem      Portfolio 1─* PortfolioSnapshot
User 1─* RefreshToken
```

- Para alanları `NUMERIC(15,4)`, lotlar `NUMERIC(20,6)` (kesirli lot desteklenir).
- Şema yalnızca Alembic ile değişir; modeller ile migration'lar arasındaki farkı yakalayan bir test vardır (D-02).

## Önemli akışlar

### 1. İşlem → pozisyon
`POST /portfolios/{id}/transactions` → sahiplik ve satır kilidi → satışsa geçmiş yeniden oynatılarak "eldekinden fazla satış" kontrolü → pozisyon yeniden hesaplanır (alış komisyonu maliyete dahil) → anlık görüntü → commit.

### 2. Portföy özeti
Eski fiyatlar paralel yenilenir (60 sn TTL) → her pozisyon portföy para birimine çevrilir → günlük değişim ve gerçekleşen kâr/zarar, işlem geçmişi ve önceki kapanıştan hesaplanır. Aynı yol analiz ekranı ve AI bağlamı tarafından da kullanılır, böylece her yerde aynı sayılar görünür.

### 3. Performans grafiği (D-34)
İşlem geçmişi ve günlük kapanışlar gün gün yeniden oynatılarak **zaman ağırlıklı getiri (TWR)** serisi kurulur; alım ve satımlar getiri sayılmaz. Seçilen endeks (BIST-100, S&P 500, NASDAQ) aynı günlere ve başlangıca hizalanır.

### 4. AI raporu (D-04, D-21, D-23)
Portföy bağlamı + paralel hesaplanan metrikler → **tek prompt, tek Gemini çağrısı** → seçili dilde rapor → kaydedilir. Gemini hata verirse uydurma metin üretilmez: uç nokta 503 döner ve hiçbir şey kaydedilmez.

### 5. Akan sohbet (D-30)
İstemci `fetch` ile akışı okur → sunucu Gemini'den gelen her parçayı geldiği anda `data: {...}` olayı olarak iletir → akış başarıyla biterse tam yanıt kaydedilir. İstemci koparsa ya da Gemini hata verirse kısmi yanıt kaydedilmez. nginx bu yanıtı tamponlamaz.

### 6. Fiyat alarmları (D-31)
Backend içinde periyodik bir görev bekleyen alarmları toplu fiyatlar. Hedefe ulaşan her alarm koşullu bir `UPDATE … RETURNING` ile **bir kez** tetiklenir ve aynı transaction'da bildirim yazılır. Frontend yalnızca bildirim tablosunu yoklar.

### 7. Kimlik doğrulama (D-28)
Kısa ömürlü access token yalnızca bellekte tutulur. Refresh token `HttpOnly` + `SameSite=Strict` cookie'dedir ve sunucuda kayıtlıdır; her yenilemede döner. Eski bir refresh token'ın tekrar kullanılması, o oturum ailesinin tamamını iptal eder. Sekmeler arası yenilemeler sıraya alınır.

## Frontend

```
src/
├── api/          axios istemcisi, oturum (401'de tek uçuşlu yenileme), SSE ayrıştırıcı
├── store/        Zustand: auth, portföy, arayüz (tema/toast), bildirim
├── i18n/         bağımlılıksız TR/EN altyapısı + Intl biçimleyiciler
├── pages/        12 sayfa
├── components/   ai/, charts/, common/, layout/, portfolio/
└── index.css     tasarım sisteminin tek token kaynağı
```

- **Stil (D-38):** Tüm renk, boşluk, yarıçap ve tipografi `index.css` içindeki token'lardan gelir; açık ve koyu tema aynı token adlarının iki değer kümesidir. Grafik renkleri de bu token'lardan okunur.
- **Hata sınırları (D-24):** Üst seviye bir sınır tüm uygulamayı, rota düzeyinde bir sınır yalnızca sayfa içeriğini korur; menü, başlık ve AI asistanı bir sayfa çökse de ayakta kalır.
- **AI metni:** Tüm AI çıktıları ham HTML'e izin vermeyen bir Markdown bileşeniyle, kaynak, tarih ve "yatırım tavsiyesi değildir" notuyla gösterilir.

Bu bileşenlerden bazıları [samples/](../samples/) klasöründe örnek olarak yer alır.

## Çalıştırma ve teslimat

- **Docker Compose:** `postgres`, `backend`, `frontend` (nginx). Backend açılırken önce migration'ları uygular; migration başarısız olursa API başlamaz. Sağlık kontrolü veritabanı hazır olana kadar frontend'i bekletir.
- **Sertleştirme:** Backend root olmayan kullanıcıyla ve tüm Linux yetenekleri kaldırılmış olarak çalışır; zayıf ya da örnek `SECRET_KEY` / veritabanı şifresiyle uygulama açılmaz (D-29).
- **CI:** Her push ve pull request'te backend testleri (gerçek PostgreSQL servisiyle) ile frontend lint, test ve build çalışır. Örnek iş akışı: [samples/.github/workflows/ci.yml](../samples/.github/workflows/ci.yml).
