import { Component } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';
import './ErrorBoundary.css';
import { t } from '../../i18n/index.js';

// Yalnızca render, yaşam döngüsü ve constructor hatalarını yakalar. Olay işleyicileri
// (onClick vb.) ve async kod (fetch, setTimeout) boundary'ye düşmez; onlar kendi
// try/catch'lerinde ele alınır (KI-25 kapsamı dışı).
class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Arayüz hatası yakalandı:', error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.reset();
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { variant = 'page', homeHref = '/dashboard', onHome } = this.props;
    const isApp = variant === 'app';

    return (
      <div className={`error-boundary error-boundary--${variant}`} role="alert">
        <div className="error-boundary-card">
          <div className="error-boundary-icon">
            <AlertTriangle size={32} />
          </div>
          <h2 className="error-boundary-title">
            {isApp ? t('errorBoundary.uygulama_beklenmedik_bir_hatayla_karsila') : t('errorBoundary.bu_sayfa_yuklenirken_bir_sorun')}
          </h2>
          <p className="error-boundary-message">
            {isApp
              ? t('errorBoundary.sayfayi_yenilemeyi_deneyebilirsiniz_soru')
              : t('errorBoundary.menuden_baska_bir_sayfaya_gecebilir')}
          </p>
          {import.meta.env.DEV && (
            <pre className="error-boundary-details">{error?.stack || String(error)}</pre>
          )}
          <div className="error-boundary-actions">
            <Button variant="primary" onClick={isApp ? () => window.location.reload() : this.reset}>
              {isApp ? t('errorBoundary.sayfayi_yenile') : t('common.tekrar_dene')}
            </Button>
            <a
              className="btn btn-secondary btn-md"
              href={homeHref}
              onClick={(e) => {
                if (onHome) {
                  e.preventDefault();
                  this.reset();
                  onHome();
                }
              }}
            >
              {isApp ? t('errorBoundary.ana_sayfaya_git') : t('errorBoundary.dashboard_a_don')}
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

// Sayfa düzeyi boundary: rota değişince hata durumu sıfırlanır, "Dashboard'a dön"
// tam sayfa yenilemek yerine istemci tarafı yönlendirme yapar.
export function RouteErrorBoundary({ children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (
    <ErrorBoundary variant="page" resetKey={pathname} onHome={() => navigate('/dashboard')}>
      {children}
    </ErrorBoundary>
  );
}
