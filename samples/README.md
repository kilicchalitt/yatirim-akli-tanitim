# Kod Örnekleri

Bu klasördeki dosyalar Yatırım Aklı'nın özel deposundan **değiştirilmeden ve otomatik olarak** alınır ve oradaki klasör yapısını korur (`samples/frontend` → ana projede `frontend/`, `samples/backend` → `backend/`). Amaç kod stilini, test yaklaşımını ve altyapıyı göstermektir. Bu klasör tek başına çalışan bir uygulama değildir; ama buradaki testler ve lint bu depoda da koşar ([../.github/workflows/ci.yml](../.github/workflows/ci.yml)).

Uygulamanın çekirdeği (API uçları, finans motoru, AI servisi ve prompt'lar, piyasa verisi katmanı, veri modeli) burada **yoktur**.

## Frontend (`samples/frontend`)

| Dosya | Ne gösterir |
|---|---|
| `src/index.css` | Tasarım sisteminin tek token kaynağı; açık ve koyu tema aynı token adlarıyla |
| `src/theme-css.spec.js` | Tema kurallarını koruyan test (iki temada aynı renk token'ları, form kontrollerinde sabit renk ya da `!important` yok) |
| `src/i18n/index.js`, `format.js`, `tr.js`, `en.js` | Kütüphanesiz TR/EN altyapısı, önbellekli `Intl` biçimleyiciler ve iki sözlük |
| `src/i18n/i18n.test.js` | İki sözlüğün anahtar ve yer tutucu eşitliği, geri düşme sırası (`node --test`) |
| `src/components/common/Field.jsx`, `Input.jsx`, `fieldIds.js` | Erişilebilir form alanı kabuğu (`aria-invalid`, `aria-describedby`, alan altı hata) |
| `src/components/common/Modal.jsx` + `Modal.spec.jsx` | Odak tuzağı, Esc, odağı geri verme ve testleri |
| `src/components/common/Toast.jsx`, `Toast.css` | Bildirim toast'ları |
| `src/components/common/ErrorBoundary.jsx` + test | Uygulama ve rota düzeyinde hata sınırı |
| `src/components/common/Button.jsx` | Temel düğme bileşeni |
| `src/store/uiStore.js` | Tema (sistem / açık / koyu), toast ve menü durumu (Zustand) |
| `src/testing/setup.js`, `vitest.config.js`, `eslint.config.js` | Test ve lint ayarı |
| `package.json`, `package-lock.json` | Yalnız bu örneklerin ihtiyacı; sürümler ana projeyle aynı ve tam sabit |

Çalıştırma: `cd samples/frontend && npm ci --legacy-peer-deps && npm run lint && npm test`

## Backend (`samples/backend`)

| Dosya | Ne gösterir |
|---|---|
| `app/config.py` | pydantic-settings ile ayarlar; zorunlu ve uzunluğu doğrulanan `SECRET_KEY`, yayımlanmış yer tutucuların ve zayıf veritabanı şifresinin reddi, `*` CORS'un reddi |
| `app/utils/security.py` | bcrypt ile parola, `exp` / `sub` / `type` alanları zorunlu JWT |
| `app/utils/cache.py` | Süreli önbellek; aynı anahtar için eşzamanlı yüklemelerin tek yüklemede birleşmesi |
| `app/utils/logging_config.py`, `request_logging.py` | `key=value` log biçimi; sorgu dizesi, başlık ve gövde yazmayan istek logu |
| `tests/unit/test_config.py`, `test_cache.py`, `test_logging_config.py` | Bu modüllerin testleri |
| `tests/conftest.py`, `pytest.ini`, `requirements.txt` | Vitrin için test ortamı (veritabanı yok; atılabilir ayar değerleri) |

Çalıştırma: `cd samples/backend && pip install -r requirements.txt && python -m pytest`

## Altyapı

| Dosya | Ne gösterir |
|---|---|
| `docker-compose.yml` | Servisler, sağlık kontrolleri, zorunlu ortam değişkenleri, container sertleştirmesi |
| `.env.example` | Ortam değişkenleri şablonu (gerçek değer içermez) |

Kod yorumlarındaki `D-xx` ve `KI-xx` numaraları karar ve sorun kayıtlarına atıftır; seçilmiş olanlar [docs/DECISIONS.md](../docs/DECISIONS.md) ve [docs/LIMITATIONS.md](../docs/LIMITATIONS.md) içindedir.
