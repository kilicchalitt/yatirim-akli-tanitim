import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import useUiStore from '../../store/uiStore';
import './Toast.css';
import { t } from '../../i18n/index.js';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

// Dört tür: başarı, hata, uyarı, bilgi. Hatalar `role="alert"` (assertive), diğerleri `status`
// (polite) ile duyurulur; bölge her zaman DOM'da olduğundan ekran okuyucular yeni öğeyi yakalar.
export default function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts);
  const removeToast = useUiStore((s) => s.removeToast);

  return (
    <div className="toast-container" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type] || Info;
        return (
          <div
            key={toast.id}
            className={`toast-item toast-${ICONS[toast.type] ? toast.type : 'info'}`}
            role={toast.type === 'error' ? 'alert' : 'status'}
          >
            <Icon size={18} className="toast-icon" aria-hidden="true" />
            <div className="toast-content">
              {toast.title && <p className="toast-title">{toast.title}</p>}
              <p className="toast-message">{toast.message}</p>
            </div>
            <button
              type="button"
              className="toast-close-btn"
              onClick={() => removeToast(toast.id)}
              aria-label={t('toast.bildirimi_kapat')}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
