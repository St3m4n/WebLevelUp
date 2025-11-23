import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import styles from './Auth.module.css';

type LoginForm = {
  correo: string;
  password: string;
};

type LoginErrors = Partial<LoginForm>;

type LocationState = {
  from?: string;
} | null;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const requiredEmailMessage = 'El correo electrónico es obligatorio.';
const invalidEmailMessage = 'Ingresa un correo electrónico válido.';
const commonCredentialError = 'Correo o contraseña incorrectos.';

const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as LocationState) ?? null;
  // Force redirect to home on login as requested
  const fromPath = '/';

  const [form, setForm] = useState<LoginForm>({ correo: '', password: '' });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [status, setStatus] = useState<{ type: 'error'; message: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(fromPath, { replace: true });
    }
  }, [fromPath, isAuthenticated, navigate]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.sessionStorage.getItem('registrationSuccess');
      if (!raw) return;
      window.sessionStorage.removeItem('registrationSuccess');
      const parsed = JSON.parse(raw) as {
        email?: string;
        refCode?: string;
      } | null;
      const email = parsed?.email ? String(parsed.email) : '';
      const refCode = parsed?.refCode ? String(parsed.refCode) : '';
      const messageParts = [
        email
          ? `Tu cuenta (${email}) fue creada con éxito.`
          : 'Tu cuenta fue creada con éxito.',
      ];
      if (refCode) {
        messageParts.push(`Tu código Level-Up es ${refCode}.`);
      }
      messageParts.push('Ingresa tus datos para iniciar sesión.');
      const message = messageParts.join(' ');
      setSuccessMessage(message);
      addToast({
        title: 'Cuenta creada',
        description: message,
        variant: 'success',
        duration: 6000,
      });
    } catch (error) {
      console.warn('No se pudo restaurar el aviso de registro en login', error);
    }
  }, [addToast]);

  const handleFieldChange =
    (field: keyof LoginForm) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
      setStatus(undefined);
    };

  const validateForm = (): LoginErrors => {
    const nextErrors: LoginErrors = {};
    if (!form.correo.trim()) {
      nextErrors.correo = requiredEmailMessage;
    } else if (!emailRegex.test(form.correo.trim())) {
      nextErrors.correo = invalidEmailMessage;
    }

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setStatus(undefined);
    try {
      await login({ correo: form.correo.trim(), password: form.password });
      navigate(fromPath, { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo iniciar sesión.';
      const normalizedMessage =
        message.startsWith('Usuario no encontrado') ||
        message === 'Ingresa tu contraseña.' ||
        message === 'Contraseña incorrecta.'
          ? commonCredentialError
          : message;
      setStatus({ type: 'error', message: normalizedMessage });
      if (message.startsWith('Usuario no encontrado')) {
        setErrors((prev) => ({ ...prev, correo: commonCredentialError }));
      }
      if (
        message === 'Ingresa tu contraseña.' ||
        message === 'Contraseña incorrecta.'
      ) {
        setErrors((prev) => ({ ...prev, password: commonCredentialError }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const registerLinkState = locationState?.from
    ? { from: locationState.from }
    : undefined;

  return (
    <div className="container">
      <div className={styles.page}>
        <div className={styles.formCard}>
          <div className={styles.header}>
            <h1 className={styles.title}>Inicia sesión</h1>
            <p className={styles.subtitle}>
              Usa tu correo y contraseña para acceder a tus puntos Level-Up. Si
              es una cuenta de prueba precargada, deja la contraseña en blanco.
            </p>
          </div>

          {successMessage && (
            <div
              role="status"
              aria-live="polite"
              className={styles.statusSuccess}
            >
              {successMessage}
            </div>
          )}

          {status && (
            <div
              role="status"
              aria-live="polite"
              className={styles.statusError}
            >
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.fieldGroup}>
              <label htmlFor="correo">Correo electrónico</label>
              <input
                id="correo"
                type="email"
                autoComplete="email"
                value={form.correo}
                onChange={handleFieldChange('correo')}
                className={errors.correo ? styles.inputError : undefined}
                required
              />
              {errors.correo && (
                <span className={styles.errorMessage}>{errors.correo}</span>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleFieldChange('password')}
                className={errors.password ? styles.inputError : undefined}
                placeholder="Deja en blanco si es una cuenta precargada"
              />
              {errors.password && (
                <span className={styles.errorMessage}>{errors.password}</span>
              )}
            </div>

            <div className={styles.actions}>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Ingresando…' : 'Entrar'}
              </button>
              <p className={styles.switchText}>
                ¿Aún no tienes cuenta?{' '}
                <Link to="/registro" state={registerLinkState}>
                  Regístrate aquí
                </Link>
              </p>
              <p className={styles.helperLink}>
                <Link to="/olvidaste">¿Olvidaste tu contraseña?</Link>
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

export default Login;
