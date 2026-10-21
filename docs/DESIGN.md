# Tasarım Sistemi

Hedef: "yapay zekâ ile yapılmış bir demo" gibi değil, **sakin, gerçekçi ve güvenilir bir finans ürünü** gibi görünen bir arayüz. Önce açık tema tasarlandı; koyu tema aynı token adlarıyla ikinci bir değer kümesi olarak eklendi.

## İlkeler

- **Tek token kaynağı.** Renk, yarıçap, tipografi, boşluk ve hareket değerleri yalnızca [`index.css`](../samples/frontend/src/index.css) içinde tanımlıdır. Bileşenlerde sabit renk kodu yazılmaz; grafikler de renklerini bu token'lardan okur.
- **Düz tasarım.** Gradient, parlama, cam efekti, neon ve emoji yok. Derinlik yüzey renkleriyle verilir; gölge yalnızca menü ve pencerelerde, çok hafif.
- **Tek vurgu rengi.** Turkuaz vurgu yalnızca küçük alanlarda kullanılır (logo, aktif durum, odak halkası); ikincil indigo grafik serileri ve etiketler için.
- **Sayılar finans gibi görünür.** Tablolarda sağa hizalı, `tabular-nums`, para birimi her zaman etiketli. Kâr/zarar yalnızca renkle değil, işaret ve ▲▼ simgesiyle de gösterilir (renk körlüğü için).
- **Dürüst durumlar.** Yükleniyor, boş ve hata durumları ayrıdır. Veri yoksa "Veri yok" denir; sahte ya da örnek veriyle doldurulmaz. Yüklenirken "hisse yok" gibi yanıltıcı boş durumlar gösterilmez.
- **AI'ı süslemeden göstermek.** AI çıktıları sade bir "Yapay zekâ analizi" etiketi, kaynak (Google Gemini), tarih ve "yatırım tavsiyesi değildir" notuyla sunulur.
- **Yazı tipi kendi sunucudan.** Inter, dış CDN olmadan uygulamayla birlikte sunulur (CSP yalnızca kendi origin'ine izin verir).

## Token'lar (açık tema, özet)

| Token | Kullanım |
|---|---|
| `--bg` / `--surface` / `--surface-2` | sayfa zemini / kart / ikincil panel |
| `--border` / `--border-strong` / `--border-input` | ince ayırıcı / etkileşimli öğe / metin girdisi kenarlığı |
| `--text` / `--text-muted` / `--text-faint` | birincil / ikincil metin / yalnızca süs ve devre dışı |
| `--brand` / `--on-brand` | birincil düğme zemini ve üstündeki metin |
| `--accent` / `--accent-strong` / `--accent-2` | küçük vurgu / vurgu renginde metin / ikincil seri |
| `--up` / `--down` / `--warn` (+ `-bg` tonları) | kâr / zarar / uyarı |
| `--chart-1..8` | grafik serileri (iki temada ayrı) |
| `--radius-*`, `--focus-ring`, `--z-*` | şekil, odak, katman sırası |

Önerilen bazı renkler beyaz zeminde WCAG AA kontrastını (4.5:1) sağlamıyordu; bu yüzden kâr, zarar, uyarı ve ikincil metin tonları **ölçülerek koyulaştırıldı**. Vurgu rengi (beyazda ~2.5:1) yalnızca metin olmayan öğelerde kullanılır; vurgu renginde metin gerektiğinde `--accent-strong` devreye girer.

## Bileşen dili

- **Form alanları:** Tek bir `Field` kabuğu (etiket, zorunlu işareti, ipucu, alan altı hata, `aria-invalid` / `aria-describedby`) üzerine `Input`, `Select`, `Textarea`. Örnek: [`Field.jsx`](../samples/frontend/src/components/common/Field.jsx), [`Input.jsx`](../samples/frontend/src/components/common/Input.jsx).
- **Modal:** Odak tuzağı, Esc ile yalnızca en üstteki pencereyi kapatma, açılınca ilk alana ve kapanınca tetikleyiciye odak; dar ekranda alt sayfa. Örnek: [`Modal.jsx`](../samples/frontend/src/components/common/Modal.jsx) ve testi.
- **Toast:** Düz kart, solda tür şeridi; hata `role="alert"`, diğerleri `role="status"`. Örnek: [`Toast.jsx`](../samples/frontend/src/components/common/Toast.jsx).
- **Hata sınırı:** Uygulama ve rota düzeyinde iki katman; hata ayrıntısı yalnızca geliştirme ortamında görünür. Örnek: [`ErrorBoundary.jsx`](../samples/frontend/src/components/common/ErrorBoundary.jsx).

## Tema ve dil

- Tema seçimi: Sistem / Açık / Koyu. Kayıtlı seçim yoksa işletim sistemi teması izlenir. Tema, CSP satır içi betiğe izin vermediği için ayrı küçük bir betikle **ilk çizimden önce** uygulanır (beyaz parlama yok).
- Dil: TR / EN. Sayı, tarih, yüzde ve para biçimleri `Intl` ile dile göre (`+%3,45` / `+3.45%`). Örnek: [`i18n/`](../samples/frontend/src/i18n/).

## Aşamalar

| Aşama | Kapsam |
|---|---|
| D1 | Token'lar, tipografi, temel bileşenler; açık temada koyu kalan select kutularının düzeltilmesi |
| D2 | Tanıtım sayfası, giriş ve kayıt |
| D3 | Uygulama kabuğu (kenar çubuğu, başlık, piyasa şeridi, bildirim zili), Gösterge Paneli, Portföy |
| D4 | İşlemler, Analiz, AI Yorumları, Haberler, İzleme Listesi, Alarmlar, Hisse detayı |
| D5 | Pencereler, formlar, ayarlar, toast'lar, boş/yükleniyor/hata durumları |
| D6 | Koyu tema (aynı token adlarıyla ikinci küme) |
| D7 | Tasarım ve erişilebilirlik denetimi |

Her aşamanın çıkış kapısı aynıydı: lint 0 hata / 0 uyarı, testler ve build yeşil, 360 / 768 / 1024 / 1440 px'te gerçek veriyle tarayıcı kontrolü (yatay taşma yok).

## Erişilebilirlik denetimi (D7)

Tarayıcıda **her metin düğümü için hesaplanan kontrast** ve yatay taşma taraması yapıldı: iki tema × iki dil × birden çok ekran genişliği. Bulunan sekiz sorun ayrı commit'lerle düzeltildi. Örnekler:

- Açık temada metin girdisi kenarlığı beyazda 1.45:1'di (WCAG 1.4.11 en az 3:1 ister) → yeni `--border-input` token'ı (3.3:1).
- Yer tutucu metinler 2.6:1'di → ikincil metin tonuna alındı (≥ 4.8:1).
- Koyu temada bildirim sayacı 2.86:1'di → `--on-down` token'ı (~6:1).
- İngilizce arayüzde Türkçe kalan bir selamlama ve dile göre değişmeyen yüzde işaretleri düzeltildi.

Bu kurallardan bazıları testle korunur: [`theme-css.spec.js`](../samples/frontend/src/theme-css.spec.js) iki temanın aynı renk token'larını tanımladığını, form kontrollerinin renklerini yalnızca token'lardan aldığını ve hiçbir kontrol kuralında sabit renk ya da `!important` olmadığını doğrular (KI-39: açık temada select kutularının koyu kalması).

**Bilinçli sınırlar:** Tüm akışlar klavyeyle tek tek elle yürütülmedi (modal odak davranışı testlerle doğrulanıyor) ve ekran okuyucuyla deneme yapılmadı.
