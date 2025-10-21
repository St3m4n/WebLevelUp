import {
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { regiones } from '@/data/regionesComunas';
import styles from './Auth.module.css';

type RegisterForm = {
  nombre: string;
  apellidos: string;
  correo: string;
  run: string;
  region: string;
  comuna: string;
  direccion: string;
  password: string;
  confirmPassword: string;
  referralCode: string;
};

type RegisterErrors = Partial<RegisterForm>;

type LocationState = {
  from?: string;
} | null;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeRun = (run: string) =>
  run.replace(/[^0-9kK]/g, '').toUpperCase();
const allowedEmailDomains = ['duoc.cl', 'profesor.duoc.cl', 'gmail.com'];
const referralCodeRegex = /^LUG-[A-Z0-9]{6}$/;

const computeDv = (digits: string): string => {
  const cleanDigits = digits.replace(/\D/g, '');
  let sum = 0;
  let multiplier = 2;
  for (let index = cleanDigits.length - 1; index >= 0; index -= 1) {
    sum += Number(cleanDigits[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const result = 11 - (sum % 11);
  if (result === 11) return '0';
  if (result === 10) return 'K';
  return String(result);
};

const isValidRun = (raw: string): boolean => {
  const clean = normalizeRun(raw);
  if (clean.length < 2) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return computeDv(body) === dv;
};

const formatRun = (raw: string): string => {
  const clean = normalizeRun(raw);
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  let formatted = '';
  let count = 0;
  for (let index = body.length - 1; index >= 0; index -= 1) {
    formatted = body[index] + formatted;
    count += 1;
    if (count === 3 && index !== 0) {
      formatted = `.${formatted}`;
      count = 0;
    }
  }
  return `${formatted}-${dv}`;
};

const Registro: React.FC = () => {
  const { register: registerUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as LocationState) ?? null;
  const fromPath =
    locationState?.from && locationState.from !== '/registro'
      ? locationState.from
      : '/';

  const [form, setForm] = useState<RegisterForm>({
    nombre: '',
    apellidos: '',
    correo: '',
    run: '',
    region: '',
    comuna: '',
    direccion: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [status, setStatus] = useState<{ type: 'error'; message: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(fromPath, { replace: true });
    }
  }, [fromPath, isAuthenticated, navigate]);

  const comunasDisponibles = useMemo(() => {
    const regionSeleccionada = regiones.find(
      (region) => region.nombre === form.region
    );
    return regionSeleccionada?.comunas ?? [];
  }, [form.region]);

  const handleFieldChange =
    (field: keyof RegisterForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      let value = event.target.value;
      if (field === 'run') {
        value = normalizeRun(value).slice(0, 9);
      }
      if (field === 'referralCode') {
        value = value
          .toUpperCase()
          .replace(/[^A-Z0-9-]/g, '')
          .slice(0, 10);
      }
      setForm((prev) => {
        if (field === 'region') {
          return {
            ...prev,
            region: value,
            comuna: '',
          };
        }
        return { ...prev, [field]: value };
      });
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          if (field === 'region') {
            delete next.comuna;
          }
          return next;
        });
      }
      setStatus(undefined);
    };

  const handleRunBlur = (event: FocusEvent<HTMLInputElement>) => {
    const formatted = formatRun(event.target.value);
    setForm((prev) => ({ ...prev, run: formatted }));
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const referralParam = params.get('ref');
    if (!referralParam) return;
    setForm((prev) => {
      if (prev.referralCode === referralParam.toUpperCase()) {
        return prev;
      }
      return {
        ...prev,
        referralCode: referralParam.toUpperCase(),
      };
    });
  }, [location.search]);

  const validateForm = (): RegisterErrors => {
    const validationErrors: RegisterErrors = {};

    const nombreLimpio = form.nombre.trim();
    if (!nombreLimpio) {
      validationErrors.nombre = 'Ingresa tu nombre.';
    } else if (nombreLimpio.length > 50) {
      validationErrors.nombre = 'El nombre no puede superar 50 caracteres.';
    }

    const apellidosLimpios = form.apellidos.trim();
    if (!apellidosLimpios) {
      validationErrors.apellidos = 'Ingresa tus apellidos.';
    } else if (apellidosLimpios.length > 100) {
      validationErrors.apellidos =
        'Los apellidos no pueden superar 100 caracteres.';
    }

    const correoLimpio = form.correo.trim();
    if (!correoLimpio || !emailRegex.test(correoLimpio)) {
      validationErrors.correo = 'Proporciona un correo válido.';
    } else if (correoLimpio.length > 100) {
      validationErrors.correo = 'El correo no puede superar 100 caracteres.';
    } else {
      const domain = correoLimpio.split('@')[1]?.toLowerCase() ?? '';
      if (!allowedEmailDomains.includes(domain)) {
        validationErrors.correo =
          'Usa un correo duoc.cl, profesor.duoc.cl o gmail.com.';
      }
    }

    const runNormalizado = normalizeRun(form.run);
    if (!runNormalizado) {
      validationErrors.run = 'Ingresa tu RUN.';
    } else if (runNormalizado.length < 7 || runNormalizado.length > 9) {
      validationErrors.run =
        'El RUN debe tener entre 7 y 9 caracteres (incluido DV).';
    } else if (!isValidRun(form.run)) {
      validationErrors.run = 'El dígito verificador (DV) no es válido.';
    }
    if (!form.region) {
      validationErrors.region = 'Selecciona una región.';
    }
    if (!form.comuna) {
      validationErrors.comuna = 'Selecciona una comuna.';
    }
    const direccionLimpia = form.direccion.trim();
    if (!direccionLimpia) {
      validationErrors.direccion = 'Indica una dirección de entrega.';
    } else if (direccionLimpia.length > 300) {
      validationErrors.direccion =
        'La dirección no puede superar 300 caracteres.';
    }

    if (!form.password) {
      validationErrors.password = 'Crea una contraseña.';
    } else if (form.password.length < 8) {
      validationErrors.password =
        'La contraseña debe tener al menos 8 caracteres.';
    }

    if (!form.confirmPassword) {
      validationErrors.confirmPassword = 'Confirma tu contraseña.';
    } else if (form.password !== form.confirmPassword) {
      validationErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    const referralCodeValue = form.referralCode.trim().toUpperCase();
    if (referralCodeValue && !referralCodeRegex.test(referralCodeValue)) {
      validationErrors.referralCode =
        'El código de referido debe tener el formato LUG-XXXXXX.';
    }

    return validationErrors;
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
      await registerUser({
        nombre: form.nombre.trim(),
        apellidos: form.apellidos.trim(),
        correo: form.correo.trim(),
        run: normalizeRun(form.run),
        region: form.region,
        comuna: form.comuna,
        direccion: form.direccion.trim(),
        password: form.password,
        referralCode: form.referralCode
          ? form.referralCode.trim().toUpperCase()
          : undefined,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo crear la cuenta.';
      setStatus({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginLinkState = locationState?.from
    ? { from: locationState.from }
    : undefined;

  return (
    <div className="container">
      <div className={styles.page}>
        <div className={styles.formCard}>
          <div className={styles.header}>
            <h1 className={styles.title}>Crea tu cuenta</h1>
            <p className={styles.subtitle}>
              Disfruta beneficios exclusivos y acumula puntos Level-Up en cada
              compra.
            </p>
          </div>

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
            <div className={styles.formRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="nombre">Nombre</label>
                <input
                  id="nombre"
                  autoComplete="given-name"
                  value={form.nombre}
                  onChange={handleFieldChange('nombre')}
                  className={errors.nombre ? styles.inputError : undefined}
                  required
                />
                {errors.nombre && (
                  <span className={styles.errorMessage}>{errors.nombre}</span>
                )}
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="apellidos">Apellidos</label>
                <input
                  id="apellidos"
                  autoComplete="family-name"
                  value={form.apellidos}
                  onChange={handleFieldChange('apellidos')}
                  className={errors.apellidos ? styles.inputError : undefined}
                  required
                />
                {errors.apellidos && (
                  <span className={styles.errorMessage}>
                    {errors.apellidos}
                  </span>
                )}
              </div>
            </div>

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

            <div className={styles.formRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="password">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleFieldChange('password')}
                  className={errors.password ? styles.inputError : undefined}
                  required
                />
                {errors.password && (
                  <span className={styles.errorMessage}>{errors.password}</span>
                )}
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="confirmPassword">Confirmar contraseña</label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={handleFieldChange('confirmPassword')}
                  className={
                    errors.confirmPassword ? styles.inputError : undefined
                  }
                  required
                />
                {errors.confirmPassword && (
                  <span className={styles.errorMessage}>
                    {errors.confirmPassword}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="run">RUN</label>
              <input
                id="run"
                value={form.run}
                onChange={handleFieldChange('run')}
                onBlur={handleRunBlur}
                className={errors.run ? styles.inputError : undefined}
                placeholder="12345678-9"
                required
              />
              {errors.run && (
                <span className={styles.errorMessage}>{errors.run}</span>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="referralCode">
                Código de referido (opcional)
              </label>
              <input
                id="referralCode"
                value={form.referralCode}
                onChange={handleFieldChange('referralCode')}
                className={errors.referralCode ? styles.inputError : undefined}
                placeholder="LUG-XXXXXX"
                inputMode="text"
                autoComplete="off"
                aria-describedby="referralCodeHelper"
              />
              <span id="referralCodeHelper" className={styles.helperText}>
                Si alguien te invitó, ingresa su código para desbloquear puntos
                extra.
              </span>
              {errors.referralCode && (
                <span className={styles.errorMessage}>
                  {errors.referralCode}
                </span>
              )}
            </div>

            <div className={styles.formRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="region">Región</label>
                <select
                  id="region"
                  value={form.region}
                  onChange={handleFieldChange('region')}
                  className={errors.region ? styles.inputError : undefined}
                  required
                >
                  <option value="" disabled>
                    Selecciona una región
                  </option>
                  {regiones.map((region) => (
                    <option key={region.nombre} value={region.nombre}>
                      {region.nombre}
                    </option>
                  ))}
                </select>
                {errors.region && (
                  <span className={styles.errorMessage}>{errors.region}</span>
                )}
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="comuna">Comuna</label>
                <select
                  id="comuna"
                  value={form.comuna}
                  onChange={handleFieldChange('comuna')}
                  disabled={comunasDisponibles.length === 0}
                  className={errors.comuna ? styles.inputError : undefined}
                  required
                >
                  <option value="" disabled>
                    {form.region
                      ? 'Selecciona una comuna'
                      : 'Selecciona una región primero'}
                  </option>
                  {comunasDisponibles.map((comuna) => (
                    <option key={comuna.nombre} value={comuna.nombre}>
                      {comuna.nombre}
                    </option>
                  ))}
                </select>
                {errors.comuna && (
                  <span className={styles.errorMessage}>{errors.comuna}</span>
                )}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="direccion">Dirección</label>
              <input
                id="direccion"
                autoComplete="street-address"
                value={form.direccion}
                onChange={handleFieldChange('direccion')}
                className={errors.direccion ? styles.inputError : undefined}
                required
              />
              {errors.direccion && (
                <span className={styles.errorMessage}>{errors.direccion}</span>
              )}
            </div>

            <div className={styles.actions}>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
              </button>
              <p className={styles.switchText}>
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login" state={loginLinkState}>
                  Inicia sesión
                </Link>
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

export default Registro;
