import { type ChangeEvent, type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';
import styles from './Auth.module.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Status = { type: 'success' | 'error'; message: string };

const Olvidaste: React.FC = () => {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<Status>();

  const validateEmail = (value: string): string => {
    const clean = value.trim();
    if (!clean) {
      return 'Ingresa tu correo electrónico.';
    }
    if (clean.length > 100) {
      return 'Máximo 100 caracteres.';
    }
    if (!emailRegex.test(clean)) {
      return 'Ingresa un correo válido.';
    }
    return '';
  };

  const emailError = touched ? validateEmail(email) : '';
  const inputClass = touched
    ? emailError
      ? styles.inputError
      : styles.inputSuccess
    : undefined;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    if (!touched) {
      setTouched(true);
    }
    if (status) {
      setStatus(undefined);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);
    const validationMessage = validateEmail(email);
    if (validationMessage) {
      setStatus({
        type: 'error',
        message: 'Revisa el correo ingresado antes de continuar.',
      });
      return;
    }
    const successMessage =
      'Correo de confirmación enviado. Revisa tu bandeja de entrada.';
    setStatus({ type: 'success', message: successMessage });
    addToast({
      title: 'Correo enviado',
      description: successMessage,
      variant: 'success',
      duration: 5000,
    });
  };

  return (
    <div className="container">
      <div className={styles.page}>
        <div className={styles.formCard}>
          <div className={styles.header}>
            <h1 className={styles.title}>¿Olvidaste tu contraseña?</h1>
            <p className={styles.subtitle}>
              Ingresa tu correo electrónico y te enviaremos instrucciones para
              restablecerla.
            </p>
          </div>

          {status && (
            <div
              role="status"
              aria-live="polite"
              className={
                status.type === 'success'
                  ? styles.statusSuccess
                  : styles.statusError
              }
            >
              {status.message}
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.fieldGroup}>
              <label htmlFor="email">Correo electrónico</label>
              <div className={styles.inputWrapper}>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
              <div className={styles.feedbackSlot}>
                {touched && emailError && (
                  <span className={styles.errorMessage}>{emailError}</span>
                )}
              </div>
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.submitButton}>
                Enviar instrucciones
              </button>
              <p className={styles.helperLink}>
                <Link to="/login">Regresar al inicio de sesión</Link>
              </p>
              <p className={styles.helperLink}>
                <Link to="/tienda">Volver a la tienda</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Olvidaste;
