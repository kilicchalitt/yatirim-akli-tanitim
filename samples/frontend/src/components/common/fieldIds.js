import { useId } from 'react';

// Form alanı kimlikleri: kontrolün `id`'si ile ipucu/hata metni kimlikleri (`aria-describedby`).
export function useFieldIds(id) {
  const autoId = useId();
  const controlId = id || `field-${autoId}`;
  return { controlId, hintId: `${controlId}-hint`, errorId: `${controlId}-error` };
}

export function describedBy({ hint, error, hintId, errorId }) {
  const ids = [error ? errorId : null, hint ? hintId : null].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}
