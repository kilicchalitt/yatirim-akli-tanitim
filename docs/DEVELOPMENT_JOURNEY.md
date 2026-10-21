# Geliştirme Süreci

Yatırım Aklı, çalışan ama sorunları olan bir **v1.0.0 demo** sürümüyle başladı. Bu belge, o demonun **doğru veri gösteren, güvenli ve test edilebilir** bir ürüne nasıl dönüştürüldüğünü anlatır.

## Başlangıç: önce denetim, sonra kod

İlk iş kod yazmak değil, mevcut durumu kayda geçirmekti:

- Kod, README ve davranış satır satır karşılaştırıldı. Bulunan her sorun numaralı bir kayıt oldu (`KI-xx`: yer, belirti, somut örnek, önem). Bu süreçte toplam **42 sorun** kaydedildi; bir kısmı ilk denetimde, bir kısmı sonraki işler sırasında bulundu.
- Her mimari karar numaralı bir kayda bağlandı (`D-xx`: karar, neden, elenen alternatifler, korunacak varsayımlar). Seçilmiş örnekler: [DECISIONS.md](DECISIONS.md).
- Kodda kanıtı olmayan iddialar "doğrulanmalı" diye işaretlendi ve ilk aşamada gerçek çalıştırmayla netleştirildi.

Denetimin bazı bulguları:

- Portföy fiyatları hiç güncellenmiyordu.
- Veritabanı şeması ile ORM modelleri uyuşmuyordu ve migration yoktu.
- "Çok ajanlı AI" anlatımının kodda karşılığı tek bir prompt'tu.
- Sohbet "akışı" gerçek zamanlı değildi ve metin kaybediyordu.
- Fiyat alarmları hiç tetiklenmiyordu.
- Grafiklerde sabit örnek veri vardı; performans grafiği alımları getiri sayıyordu.
- Kullanıcı ~30 dakikada oturumdan atılıyordu.

## Çalışma kuralları

1. **Her adımda tek görev.** Görevler teknik bağımlılığa göre sıralandı.
2. **Önce test.** Davranış değiştiren her düzeltmeden önce, hatayı gösteren ve başarısız olan bir test yazıldı.
3. **Şema yalnızca migration ile değişir.**
4. **Her görev belgeleri günceller:** sorun kaydı "çözüldü" olur, yeni kararlar kaydedilir, mimari belge kodla uyumlu tutulur.
5. **Atomik commit'ler:** her commit tek bir mantıksal değişiklik.
6. **Her aşamanın çıkış kapısı vardır:** testler, lint ve build yeşil; arayüz işlerinde gerçek veriyle tarayıcıda dört ekran genişliğinde kontrol.
7. **Sahte veri yok:** veri yoksa "veri yok" denir; hata, rapor gibi gösterilmez.

## Aşamalar

| Aşama | Amaç | Öne çıkanlar |
|---|---|---|
| **Faz 0 — Zemin** | Değişiklikleri güvenle yapabilmek | Uçtan uca smoke test, gerçek PostgreSQL üzerinde backend test altyapısı (ağsız), bağımlılık sabitleme, ESLint |
| **Faz 1 — Veri doğruluğu** | Ekrandaki sayıların doğru ve güncel olması | Alembic, okuma anında TTL'li fiyat yenileme, piyasa verisi önbelleği, sembol normalizasyonu, çoklu para birimi, eşzamanlı session hatasının giderilmesi |
| **Faz 2 — Güvenlik** | Oturum deneyimi ve bariz açıklar | Refresh token akışı, hız sınırı, zorunlu sırlar, JWT uyumluluğu; ardından ayrı bir güvenlik gözden geçirmesi (httpOnly cookie + sunucu kaydı + rotasyon, CSP, kapalı portlar) |
| **Faz 3 — AI güvenilirliği** | AI'ın dürüst ve kararlı çalışması | Hata metninin rapor gibi saklanmasının engellenmesi, yeni Gemini SDK'sı, gerçek SSE akışı, çok ajanlı anlatımın koda uydurulması |
| **Faz 4 — Özellikler** | Yarım kalanları bitirmek | Fiyat alarmları + uygulama içi bildirim, gerçek TWR performans grafiği, gerçekleşen kâr/zarar + günlük değişim, profil ve portföy düzenleme, finansal hesap düzeltmeleri, React hata sınırları |
| **Faz 5 — Temizlik ve operasyon** | Bakım ve görünürlük | Ölü kod temizliği (lint 0 hata / 0 uyarı), yapılandırılmış log, hazır olma (readiness) uç noktası, CI, Python kilit dosyası |
| **D1–D7 — Tasarım** | Güvenilir bir finans ürünü görünümü | Tek token kaynaklı tasarım sistemi, tüm sayfaların yenilenmesi, koyu tema, erişilebilirlik denetimi ([DESIGN.md](DESIGN.md)) |
| **L1–L2 — Dil** | Türkçe ve İngilizce | Bağımlılıksız arayüz i18n'i; backend'de mesaj kataloğu, dilli AI yanıtları ve bildirimler |
| **F1 — Frontend testleri** | Arayüz davranışını korumak | Vitest + Testing Library: oturum akışı, SSE ayrıştırıcı, hata sınırı, kayıt formu, bildirim zili, pencere odağı, tema kuralları |
| **K1 — Borsa birimleri** | Londra hisselerinde 100 kat hata | Pence/cent gibi küçük birimlerin piyasa verisi katmanında ana birime çevrilmesi |

## Örnek bir hata hikâyesi

**Sorun:** Analiz sayfasındaki performans grafiği bir portföy için **+%236** getiri gösteriyordu.

**Kök neden:** Grafik iki anlık görüntü arasındaki değer farkını getiri sayıyordu; yeni alımlar da "kazanç" gibi görünüyordu.

**Karar:** Fonların raporladığı yöntem olan zaman ağırlıklı getiriye (TWR) geçildi. Değer serisi işlem geçmişi ve günlük kapanışlardan yeniden kuruldu, alım ve satımlar nakit akışı olarak ayrıldı, endeks aynı günlere hizalandı.

**Sonuç:** Aynı portföyün gerçek getirisi **−%3,74** çıktı. Grafik artık BIST-100, S&P 500 veya NASDAQ ile adil karşılaştırılabiliyor. Ayrıntı: [DECISIONS.md → D-34](DECISIONS.md#d-34--performans-grafiği-zaman-ağırlıklı-getiri-twr).

## Bugünkü durum

| Ölçüt | Değer |
|---|---|
| Backend testleri | 612 (pytest; gerçek PostgreSQL, ağ yok) |
| Frontend testleri | 38 Vitest + 44 `node --test` |
| Lint | 0 hata / 0 uyarı |
| CI | Her push'ta backend testleri + frontend lint, test, build |
| Kayıtlı sorunlar | 42 (39 çözüldü, 3 kısmen; kalanlar ve bilinen sınırlar [LIMITATIONS.md](LIMITATIONS.md) içinde) |
| Kayıtlı kararlar | 42 |
| Canlıya hazırlık | HTTPS'li üretim compose dosyası hazır; sunucu ve alan adı henüz yok |
