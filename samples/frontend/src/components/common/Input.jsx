import { forwardRef } from 'react';
import Field from './Field';
import { useFieldIds, describedBy } from './fieldIds';

// Tek girdi bileşeni (`.input`). Etiket, ipucu ve alan altı hata metni (`aria-invalid`,
// `aria-describedby`) burada; sayfalar ham `<input>` yerine bunu kullanır.
const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    icon: Icon,
    type = 'text',
    id,
    className = '',
    containerClassName = '',
    required = false,
    ...props
  },
  ref
) {
  const { controlId, hintId, errorId } = useFieldIds(id);

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      controlId={controlId}
      hintId={hintId}
      errorId={errorId}
      required={required}
      className={containerClassName}
    >
      <div className="input-wrapper">
        {Icon && (
          <span className="input-icon">
            <Icon size={16} />
          </span>
        )}
        <input
          ref={ref}
          type={type}
          id={controlId}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy({ hint, error, hintId, errorId })}
          className={['input', Icon ? 'input--with-icon' : '', error ? 'input--error' : '', className]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
      </div>
    </Field>
  );
});

export default Input;
