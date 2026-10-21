// Ortak form alanı kabuğu: etiket, ipucu ve alan altı hata metni (kimlikler: fieldIds.js).
export default function Field({
  label,
  hint,
  error,
  controlId,
  hintId,
  errorId,
  required = false,
  className = '',
  children,
}) {
  return (
    <div className={`input-group ${className}`.trim()}>
      {label && (
        <label htmlFor={controlId} className="input-label">
          {label}
          {required && <span className="input-required" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <span id={hintId} className="input-hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className="input-error-text" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
