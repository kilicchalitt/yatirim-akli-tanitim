"""Vitrin testleri: uygulama ayarları import edilmeden önce atılabilir değerler kurulur.

Ana projede bu işi veritabanı yardımcıları yapar; vitrinde veritabanı yoktur ve buradaki
testler (ayarlar, önbellek, log) veritabanına bağlanmaz.
"""

import os

os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("SECRET_KEY", "vitrin-ci-only-not-a-secret-0123456789abcdef")
# Doğrulayıcı boş ya da varsayılan şifreyi reddettiği için atılabilir bir değer; bağlantı kurulmaz.
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://vitrin:vitrin-ci-only-not-a-secret@localhost:5432/vitrin")
os.environ.setdefault("GEMINI_API_KEY", "")
# Ana projenin test ortamıyla aynı: arka plandaki alarm döngüsü testlerde kapalı (test_config bunu denetler).
os.environ.setdefault("ALERT_CHECK_INTERVAL_SECONDS", "0")
