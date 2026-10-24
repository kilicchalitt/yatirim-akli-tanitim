# Seçilmiş Mühendislik Kararları

Ana projede her önemli karar bir numarayla (`D-xx`) kaydedildi: ne seçildiği, neden, hangi alternatiflerin neden elendiği ve sonradan bozulmaması gereken varsayımlar. Bu belge o kayıttan seçilmiş, kısaltılmış bir derlemedir. Numaralar ana projedekiyle aynıdır, bu yüzden aralarında boşluk vardır. `KI-xx` numaraları [LIMITATIONS.md](LIMITATIONS.md) içindeki sorun kayıtlarına karşılık gelir.

---

## Altyapı ve veri

### D-01 · Async Python backend
**Karar:** FastAPI + SQLAlchemy 2 (async) + asyncpg.
**Neden:** Uygulama dış I/O ağırlıklı (piyasa verisi, Gemini, RSS) ve gerçek zamanlı akan yanıt (SSE) gerekiyor.

### D-02 · Şemanın tek kaynağı Alembic
**Karar:** Şema yalnızca migration'larla tanımlanır. Container açılırken önce `alembic upgrade head`, sonra API başlar. Eski `init.sql` dönemi veritabanları "baseline" olarak işaretlenip aynı yoldan geçirilir.
**Alternatifler:** `create_all` (mevcut tabloları değiştirmez; asıl sorunun kaynağıydı), elle SQL (sürüm takibi yok).
**Korunan varsayım:** Modeller ile migration'lar arasında fark oluşursa bir test başarısız olur.

### D-03 · Piyasa verisi: yfinance
**Neden:** Ücretsiz, çok borsalı, anahtar gerektirmiyor. BIST sembolleri `.IS` sonekiyle tutulur.

### D-07 · Pozisyon işlemlerden türetilir
**Karar:** Lot ve ortalama maliyet her işlem değişikliğinde o hissenin tüm geçmişi yeniden oynatılarak hesaplanır; elle yazılmaz. Satış ortalama maliyeti değiştirmez.

### D-12 · Test stratejisi: gerçek PostgreSQL, üretimle aynı şema, ağ yok
**Karar:** API testleri ayrı bir `_test` veritabanında, üretimle aynı migration'larla kurulan şemada koşar ve her testten sonra temizlenir. Piyasa verisi sahtelenir; test sırasında gerçek ağ çağrısı hata verir. Testler adı `_test` ile bitmeyen bir veritabanına hiç bağlanmaz.
**Neden:** Bulunan veri hataları gerçek PostgreSQL tip davranışından kaynaklanıyordu; SQLite ya da modellerden üretilmiş bir şema bunları gizlerdi.
**Alternatifler:** SQLite bellek içi (tip farkları gizlenir), testcontainers (ek bağımlılık ve karmaşıklık).

### D-14 · Yükleme ile hesaplamanın ayrılması
**Karar:** Servisler önce veritabanından yükler, sonra session'a dokunmayan saf fonksiyonlarla hesaplar; paralellik yalnızca bu saf kısımda kurulur.
**Neden:** Async SQLAlchemy session'ı eşzamanlı görevler arasında paylaşılamaz. Satırları bir kez yüklemek aynı sorguların tekrarını da önler.

### D-15 · Piyasa verisine tek erişim katmanı + süreç içi önbellek
**Karar:** Hiçbir servis yfinance'i doğrudan çağırmaz. Tek bir katman senkron çağrıları thread'de çalıştırır, sonuçları süreli önbellekte tutar ve aynı anahtar için eşzamanlı istekleri tek yüklemede birleştirir. Başarısız sonuçlar kısa süre önbellekte kalır (kesintide Yahoo'ya yük bindirmemek için).
**Alternatifler:** Redis (tek süreç için gereksiz altyapı), arka planda periyodik yenileme (kimsenin bakmadığı sembolleri de çeker).

### D-16 · Fiyatlar okuma anında, süreli yenilenir
**Karar:** Portföy okunurken fiyatı 60 saniyeden eski olan hisseler paralel olarak yenilenir; yenileme başarısız olursa son bilinen fiyat kullanılır.
**Neden:** Kimse bakmazken fiyat çekmek gereksiz yük yaratır; okuma anında yenileme yalnızca görüntülenen portföyleri günceller.
**Alternatifler:** Arka planda zamanlanmış görev (kimse bakmazken de çalışır), fiyatları istemcide hesaplamak (analiz ve AI eski fiyatla kalırdı).

### D-17 · Sembol politikası
**Karar:** Kanonik sembol Yahoo sembolüdür. Normalizasyon ağsız ve tek yerde yapılır; çıplak bir sembole `.IS` yalnızca bilinen bir BIST sembolüyse eklenir, bilinmeyenler gerçek fiyat sorgusuyla çözülür.
**Neden:** Uzunluğa göre `.IS` eklemek ABD sembollerini bozuyordu; "yazım hatası düzeltmesi" gerçek sembolleri başka hisselere çeviriyordu.

### D-18 · Değerleme para birimi
**Karar:** Toplamlar her portföyün kendi para biriminde; farklı para birimli pozisyonlar güncel kurla çevrilir.
**Bilinen sınır:** Tarihsel kur saklanmadığı için kur kazancı kâr/zarara dahil değildir.

### D-40 · Küçük birimli fiyatlar
**Kök neden:** Yahoo, Londra hisselerini pence ile veriyor (benzer şekilde Johannesburg cent, Tel Aviv agorot). Kayıtlı para birimi GBP iken fiyat pence geldiği için değer **100 kat büyük** görünüyordu.
**Karar:** Küçük birimler piyasa verisi katmanında, tek bir tabloyla ana birime çevrilir; böylece fiyat, maliyet, kur çevrimi, grafikler ve alarmlar aynı birimde çalışır.

---

## Güvenlik

### D-20 · Hız sınırı ve zorunlu sırlar
**Karar:** AI, giriş, kayıt ve yenileme uç noktalarında süreç içi kayan pencere sayacı (yeni bağımlılık yok); hatalı girişte e-posta başına geçici kilit. `SECRET_KEY` zorunlu ve uzunluğu doğrulanıyor. Piyasa uç noktaları giriş ister.
**Neden:** AI uç noktaları ücretli kotayı, piyasa uç noktaları Yahoo kotasını tüketebiliyordu.
**Bilinen sınır:** Sayaçlar süreç içi; birden çok worker'a geçilirse ortak bir depoya taşınmalı.

### D-42 · Oturum yenilemesinin kendi hız sınırı
**Kök neden:** Her tam sayfa yüklemesi oturumu bir kez yeniler. Yenileme, giriş ve kayıtla aynı sayacı (adres başına dakikada 20) paylaştığı için kısa sürede çok sayfa açıldığında oturum düşüyordu (KI-42).
**Karar:** Yenileme ayrı bir sayaçta ve daha yüksek bir sınırda; giriş, kayıt ve e-posta başına parola kilidi değişmedi.

### D-28 · Oturum modeli
**Karar:** Access token yalnızca bellekte; refresh token `HttpOnly` + `SameSite=Strict` cookie'de ve **sunucuda kayıtlı**. Her yenilemede döner; eski bir token'ın tekrar kullanılması o oturum ailesini iptal eder.
**Elenen seçenekler:** localStorage + sıkı CSP (XSS'te token çalınır), iki token da cookie + CSRF token (daha fazla hareketli parça), kullanıcı başına token sürümü (tek cihazdan çıkış ve çalıntı tespiti sağlamaz).

### D-29 · Güvenlik gözden geçirmesi ve dağıtım sertleştirmesi
**Kapsam:** Kimlik doğrulama, profil ve log kodu satır satır incelendi; tüm sorguların kullanıcıya göre filtrelendiği (IDOR olmadığı) doğrulandı.
**Bulunan ve düzeltilenler (her biri önce başarısız bir testle yakalandı):**
- Giriş kilidinde yarış durumu: 10 paralel yanlış şifre, kilit 3'teyken 10 kez denenebiliyordu. Deneme artık parola kontrolünden önce sayılıyor.
- Zamanlama ile kullanıcı tespiti: olmayan e-posta parola özetini atladığı için ~0,25 sn hızlı dönüyordu. Artık her durumda aynı iş yapılıyor; bcrypt de event loop'u bloke etmesin diye thread'e alındı.
- `exp` / `sub` / `type` alanı olmayan imzalı token kabul ediliyordu; artık zorunlu.
- Sınırsız girdi uzunlukları (ör. sohbet sorusu) sınırlandı.
**Dağıtım:** Backend ve veritabanı portları host'a kapatıldı, nginx'e CSP ve güvenlik başlıkları eklendi, zayıf ya da örnek veritabanı şifresiyle açılış engellendi, container'lar root olmayan kullanıcıyla ve yetenekleri kaldırılmış olarak çalışıyor.

---

## Yapay zekâ

### D-04 / D-23 · Tek çağrılı AI, çok ajanlı anlatım yok
**Karar:** Her AI özelliği (rapor, risk, what-if, dengeleme, sohbet) kullanıcı eylemi başına **tek Gemini çağrısı** yapar. Haberler prompt'lara girmez.
**Neden:** Gecikme ve kota. Projenin ilk sürümü "çok ajanlı" bir sistemden bahsediyordu ama kodda karşılığı tek prompt'tu. Gerçek çok ajanlı akış kurmak yerine **anlatım koda uyduruldu**: kullanılmayan ajan sınıfları silindi, README ve arayüz metinleri düzeltildi, prompt'tan var olmayan analizleri iddia eden bölümler çıkarıldı.

### D-21 · AI hatası rapor değil hatadır
**Karar:** Anahtar yoksa, kota dolduysa ya da Gemini hata verirse uç nokta 503 döner; sabit "otomatik değerlendirme" metni kaldırıldı ve hiçbir hata metni rapor olarak kaydedilmez. Hesaplanan sayıların değerli olduğu uç noktalar (simülasyon, dengeleme) sayıları döndürür, AI yorumunun yerine hata alanı koyar.
**Neden:** Eski davranış hata metnini gerçek rapor gibi saklıyordu; rapor karşılaştırma ve sohbet hafızası bunları girdi olarak kullanıyordu.

### D-30 · Gerçek SSE akışı
**Karar:** Gemini'den gelen her parça **geldiği anda** tek satır JSON olayı olarak iletilir. Tam yanıt yalnızca akış başarıyla biterse, kendi session'ıyla kaydedilir; istemci koparsa ya da hata olursa kısmi yanıt kaydedilmez.
**Sonuç:** Önceki sürümde yanıt önce tamamen toplanıp sonra "akıtılıyordu" ve satır kaybı vardı. Canlı ölçümde ilk metin ~0,5–0,7 sn'de geliyor, satır kaybı yok.

---

## Finansal hesaplar

### D-31 · Fiyat alarmları
**Karar:** Backend içinde periyodik bir görev; bekleyen alarmlar sembol başına bir kez fiyatlanır. Her alarm koşullu `UPDATE … WHERE is_triggered = false … RETURNING` ile **tam bir kez** tetiklenir ve bildirim aynı transaction'da yazılır. Bildirim yalnızca uygulama içi.

### D-37 · Bildirim temizliği
**Karar:** Kullanıcı bildirimleri tek tek silebilir; ayrıca okunmuş ve belirli bir süreden (varsayılan 30 gün) eski bildirimler alarm döngüsünde otomatik silinir. Okunmamışlar hiç silinmez (KI-34).

### D-32 · Risk ve maliyet hesapları
**Karar:** Hisselerin fiyat serileri **tarihe göre hizalanır** (BIST ve ABD tatilleri ayrı); portföy volatilitesi hisseler arası korelasyonu hesaba katar (kovaryans matrisi); alış komisyonu maliyete eklenir; risksiz faiz ayarlanabilir; lot bakiyesini tutarsız bırakacak işlemler (dayandığı satış varken alışı silmek, geçmişe dönük fazla satış) reddedilir.
**Neden:** Önceki sürüm serileri sıra numarasıyla eşliyordu (farklı borsaların farklı günleri karışıyordu) ve volatiliteyi ağırlıklı ortalama olarak alıyordu (çeşitlendirmenin etkisini yok sayıyordu).
**Doğrulama:** Formüller canlı veride bağımsız bir yeniden hesaplamayla karşılaştırıldı ve birebir tuttu. Bu denetimde ayrıca aynı gün içinde sat-geri al işlemlerinin yanlış sıralanması da yakalanıp düzeltildi.

### D-34 · Performans grafiği: zaman ağırlıklı getiri (TWR)
**Karar:** Değer serisi işlem geçmişi ve günlük kapanışlardan yeniden kurulur; alım ve satımlar nakit akışı olarak ayrılır, getiri sayılmaz. Endeks aynı günlere ve başlangıca hizalanır.
**Neden:** Eski grafik iki anlık görüntü arasındaki değer farkını getiri sayıyordu. Aynı portföy için eski yöntem **+%236**, TWR **−%3,74** gösteriyordu. TWR yatırılan tutardan bağımsızdır, bu yüzden endeksle adil karşılaştırılır (fonların raporladığı yöntem).

---

## Frontend

### D-10 · Aynı origin'den dağıtım
**Karar:** Frontend ve API aynı origin'den sunulur (nginx `/api` ters vekili); SSE için tamponlama kapatılır.

### D-13 · Bağımlılık politikası
**Karar:** Tüm bağımlılıklar tam sürüme sabitli; frontend kilidi build image'ıyla aynı ortamda üretilir, Python tarafında geçişli bağımlılıklar dahil tam kilit dosyası var. Yeni bağımlılık yalnızca gerçekten gerekiyorsa eklenir; i18n ve hata sınırları bu yüzden kütüphanesiz yazıldı.

### D-24 · React hata sınırları
**Karar:** Kendi sınıf bileşenimiz (ek bağımlılık yok), iki katman: üst seviye sınır tüm uygulamayı, rota sınırı yalnızca sayfa içeriğini korur ve rota değişince sıfırlanır. Hata ayrıntısı yalnızca geliştirme ortamında görünür. Örnek: [`ErrorBoundary.jsx`](../samples/frontend/src/components/common/ErrorBoundary.jsx).

### D-38 · Tasarım sistemi
**Karar:** Açık tema birincil; tek token kaynağı; koyu tema aynı token adlarıyla ikinci değer kümesi; yazı tipi kendi sunucudan. Ayrıntı: [DESIGN.md](DESIGN.md).

### D-39 · TR/EN backend
**Karar:** İstek dili `Accept-Language`'tan, giriş yapılmışsa hesaptan gelir. Hata mesajları, doğrulama hataları, bildirimler ve AI yanıtları tek bir mesaj kataloğundan bu dilde üretilir; her AI raporunun dili saklanır.

### D-41 · TR/EN arayüz: bağımlılıksız i18n
**Karar:** Kütüphane eklenmedi. Düz sözlükler, `t(anahtar, {ad})` ve önbellekli `Intl` biçimleyiciler. Dil değişince sayfa yenilenir. İki sözlüğün anahtar eşitliği testle korunur.
**Neden yenileme:** Metinlerin, biçimleyicilerin ve modül düzeyindeki sabitlerin tek seferde doğru dille yeniden kurulmasının en basit güvenilir yolu. Örnek: [`i18n/`](../samples/frontend/src/i18n/).
