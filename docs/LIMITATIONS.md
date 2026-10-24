# Bilinen Sınırlar ve Seçilmiş Sorunlar

Ana projede her sorun numaralı bir kayıtla (`KI-xx`) izlendi. Bu belgede önce **bugün bilinen sınırlar**, ardından çözülen sorunlardan **seçilmiş örnekler** yer alır.

## Bilinen sınırlar

### Altyapı
- **Tek süreç varsayımı.** Hız sınırı sayaçları ve piyasa verisi önbelleği süreç içinde tutulur; uygulama tek worker ile çalışır. Birden çok worker'a ya da sunucuya geçilirse bunların Redis gibi ortak bir depoya taşınması gerekir (D-15, D-20).
- **Canlı ortam.** HTTPS, HTTP→HTTPS yönlendirmesi ve HSTS içeren üretim yapılandırması hazır; uygulama henüz bir sunucuda yayında değil (KI-15, büyük ölçüde çözüldü).
- **Docker'sız geliştirme** kısmen doğrulandı (KI-21).

### Ürün kararları
- **Kur hareketi.** Tarihsel kur saklanmadığı için yabancı para birimli pozisyonlarda kur kazancı kâr/zarara dahil değildir; yabancı para birimli satışların gerçekleşen kâr/zararı bugünkü kurla çevrilir (D-18).
- **Performans grafiği** kurun kendi hareketini içermez; endeks kendi para biriminde karşılaştırılır (D-34).
- **Seans içi önceki kapanış.** Londra ve BIST hisselerinde seans açıkken veri sağlayıcının önceki kapanışı eksik gelebiliyor; bu durumda günlük değişim yaklaşık olabilir (D-40).
- **Risk metrikleri.** Getiriler her hissenin kendi para birimindedir; tek bir risksiz faiz oranı tüm para birimlerine uygulanır; geçmişi olmayan bir hisse riski olduğundan düşük gösterebilir.
- **Bildirimler** yalnızca uygulama içidir; e-posta ya da push yoktur (D-31).

### Test ve erişilebilirlik
- Tüm akışlar klavyeyle tek tek elle yürütülmedi (pencere odak davranışı testlerle doğrulanıyor); ekran okuyucuyla deneme yapılmadı.

## Seçilmiş çözülen sorunlar

| Kayıt | Sorun | Çözüm |
|---|---|---|
| KI-01 | Portföy fiyatları hiç güncellenmiyordu | Okuma anında TTL'li yenileme; başarısızlıkta son bilinen fiyat (D-16) |
| KI-02 | Veritabanı şeması ile modeller uyuşmuyordu, migration yoktu | Alembic tek kaynak + modeller ile migration'lar arasındaki farkı yakalayan test (D-02) |
| KI-04 | "Çok ajanlı AI" anlatımı, kodda tek prompt'tu | Anlatım koda uyduruldu; kullanılmayan ajan sınıfları silindi (D-23) |
| KI-05 | Sohbet akışı gerçek zamanlı değildi, metin kaybı vardı | Gerçek SSE; ilk metin ~0,5–0,7 sn, kayıp yok (D-30) |
| KI-07 | Fiyat alarmları hiç tetiklenmiyordu | Periyodik görev + koşullu `UPDATE` ile tam bir kez tetikleme (D-31) |
| KI-10 | Sembol "düzeltmesi" gerçek sembolleri başka hisselere çeviriyordu | Tek normalizasyon + gerçek fiyat sorgusuyla çözümleme (D-17) |
| KI-17 | AI hata metni gerçek rapor gibi kaydediliyordu | Hata 503 olur, hiçbir şey kaydedilmez (D-21) |
| KI-24 | Performans grafiği alımları getiri sayıyordu (+%236) | Zaman ağırlıklı getiri; aynı portföy −%3,74 (D-34) |
| KI-25 | Tek bir bileşen hatası tüm ekranı beyaza çeviriyordu | İki katmanlı hata sınırı; menü ve başlık ayakta kalır (D-24) |
| KI-27 | Londra hisselerinin değeri 100 kat büyük görünüyordu (pence) | Küçük birimler veri katmanında ana birime çevrilir (D-40) |
| KI-32 | E-posta büyük/küçük harfe duyarlıydı (`Alice@…` ve `alice@…` iki ayrı hesap olabiliyordu) | Küçük harfle saklama + `lower(email)` üzerinde unique index |
| KI-34 | Bildirimler hiç silinmiyordu, tablo sınırsız büyüyordu | Tek tek silme + okunmuş eski bildirimlerin otomatik temizliği (D-37) |
| KI-39 | Açık temada select kutuları koyu kalıyor, metin okunmuyordu | `!important` blokları kaldırıldı, tüm kontroller token'lara bağlandı; tema testi eklendi |
| KI-42 | Kısa sürede çok sayfa yenilemesinde oturum düşüyordu | Oturum yenileme kendi hız sınırı sayacına taşındı |
