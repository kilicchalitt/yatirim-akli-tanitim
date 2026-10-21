import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { t } from '../../i18n/index.js';

const SIZES = { sm: '420px', md: '520px', lg: '680px', xl: '860px' };

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Açık pencereler üst üste gelebilir: Esc ve odak tuzağı yalnızca en üsttekini etkiler.
const openModals = [];

/**
 * Ortak pencere: başlık / gövde / eylem (footer) düzeni. Esc ile kapanır, odak pencerenin
 * içinde kalır (Tab döngüsü), açılınca ilk alana odaklanır ve kapanınca önceki öğeye döner.
 * ≤560 px'te alt sayfa olarak tam genişlikte açılır (CSS).
 */
export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const token = {};
    openModals.push(token);
    const previouslyFocused = document.activeElement;
    const dialog = dialogRef.current;

    // İlk alan: [autofocus] / ilk form kontrolü; yoksa kapat düğmesi dışındaki ilk odaklanabilir öğe.
    const focusables = () => Array.from(dialog.querySelectorAll(FOCUSABLE));
    const body = dialog.querySelector('.modal-body');
    const first =
      body?.querySelector('[autofocus], input:not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled])') ||
      body?.querySelector(FOCUSABLE) ||
      focusables()[0];
    (first || dialog).focus();

    const onKeyDown = (e) => {
      if (openModals[openModals.length - 1] !== token) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === firstEl || document.activeElement === dialog)) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const idx = openModals.indexOf(token);
      if (idx >= 0) openModals.splice(idx, 1);
      if (openModals.length === 0) document.body.style.overflow = '';
      if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div
        ref={dialogRef}
        className="modal"
        style={{ '--modal-max-width': SIZES[size] || SIZES.md }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 className="modal-title" id={titleId}>
            {title}
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label={t('common.kapat')}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
