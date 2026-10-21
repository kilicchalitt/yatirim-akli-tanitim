# Kod Örnekleri

Bu klasördeki dosyalar Yatırım Aklı'nın özel deposundan **değiştirilmeden** alınmıştır ve oradaki klasör yapısını korur. Amaç kod stilini, test yaklaşımını ve tasarım sistemini göstermektir; bu klasör tek başına çalıştırılabilir bir proje değildir (bağımlı olduğu diğer dosyalar, ör. dil sözlükleri, burada yoktur).

| Dosya | Ne gösterir |
|---|---|
| `frontend/src/index.css` | Tasarım sisteminin tek token kaynağı; açık ve koyu tema aynı token adlarıyla |
| `frontend/src/theme-css.spec.js` | Tema kurallarını koruyan test (iki temada aynı token'lar, form kontrollerinde sabit renk ya da `!important` yok) |
| `frontend/src/i18n/index.js`, `format.js` | Kütüphanesiz TR/EN altyapısı ve önbellekli `Intl` biçimleyiciler |
| `frontend/src/components/common/Field.jsx`, `Input.jsx`, `fieldIds.js` | Erişilebilir form alanı kabuğu (`aria-invalid`, `aria-describedby`, alan altı hata) |
| `frontend/src/components/common/Modal.jsx` + `Modal.spec.jsx` | Odak tuzağı, Esc, odağı geri verme ve bunların testleri |
| `frontend/src/components/common/Toast.jsx`, `Toast.css` | Bildirim toast'ları |
| `frontend/src/components/common/ErrorBoundary.jsx` + test | Uygulama ve rota düzeyinde hata sınırı |
| `frontend/src/components/common/Button.jsx` | Temel düğme bileşeni |
| `frontend/src/store/uiStore.js` | Tema (sistem / açık / koyu), toast ve menü durumu (Zustand) |
| `frontend/src/testing/setup.js` | Vitest kurulumu |
| `docker-compose.yml` | Servisler, sağlık kontrolleri, zorunlu ortam değişkenleri, container sertleştirmesi |
| `.env.example` | Ortam değişkenleri şablonu (gerçek değer içermez) |
| `.github/workflows/ci.yml` | CI: gerçek PostgreSQL ile backend testleri, frontend lint, test ve build. Bu klasörde olduğu için GitHub tarafından çalıştırılmaz |

Kod yorumlarındaki `D-xx` ve `KI-xx` numaraları karar ve sorun kayıtlarına atıftır; seçilmiş olanları [docs/DECISIONS.md](../docs/DECISIONS.md) ve [docs/LIMITATIONS.md](../docs/LIMITATIONS.md) içinde bulunur.
