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
import { useRegions } from '@/hooks/useRegions';
import styles from './Auth.module.css';

type RegisterForm = {
  nombre: string;
  apellidos: string;
  correo: string;
  run: string;
  fechaNacimiento: string;
  region: string;
  comuna: string;
  direccion: string;
  password: string;
  confirmPassword: string;
  referralCode: string;
  termsAccepted: boolean;
};

type RegisterErrors = Partial<Record<keyof RegisterForm, string>>;
type EditableField = Exclude<keyof RegisterForm, 'termsAccepted'>;

type LocationState = {
  from?: string;
} | null;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeRun = (run: string) =>
  run.replace(/[^0-9kK]/g, '').toUpperCase();
const allowedEmailDomains = ['duoc.cl', 'profesor.duoc.cl', 'gmail.com'];
const referralCodeRegex = /^LUG-[A-Z0-9]{6}$/;

const getValidationScope = (
  field: keyof RegisterForm
): Array<keyof RegisterForm> => {
  switch (field) {
    case 'password':
    case 'confirmPassword':
      return ['password', 'confirmPassword'];
    case 'region':
      return ['region', 'comuna'];
    default:
      return [field];
  }
};

const validateField = (
  field: keyof RegisterForm,
  state: RegisterForm
): string | null => {
  switch (field) {
    case 'nombre': {
      const value = state.nombre.trim();
      if (!value) return 'Ingresa tu nombre.';
      if (value.length > 50) return 'El nombre no puede superar 50 caracteres.';
      return null;
    }
    case 'apellidos': {
      const value = state.apellidos.trim();
      if (!value) return 'Ingresa tus apellidos.';
      if (value.length > 100)
        return 'Los apellidos no pueden superar 100 caracteres.';
      return null;
    }
    case 'correo': {
      const value = state.correo.trim();
      if (!value || !emailRegex.test(value))
        return 'Proporciona un correo válido.';
      if (value.length > 100)
        return 'El correo no puede superar 100 caracteres.';
      const domain = value.split('@')[1]?.toLowerCase() ?? '';
      if (!allowedEmailDomains.includes(domain)) {
        return 'Usa un correo duoc.cl, profesor.duoc.cl o gmail.com.';
      }
      return null;
    }
    case 'run': {
      const value = normalizeRun(state.run);
      if (!value) return 'Ingresa tu RUN.';
      if (value.length < 7 || value.length > 9)
        return 'El RUN debe tener entre 7 y 9 caracteres (incluido DV).';
      if (!isValidRun(state.run))
        return 'El dígito verificador (DV) no es válido.';
      return null;
    }
    case 'fechaNacimiento': {
      const value = state.fechaNacimiento.trim();
      if (!value) return 'Ingresa tu fecha de nacimiento.';
      const birthDate = new Date(value);
      if (Number.isNaN(birthDate.getTime())) return 'Ingresa una fecha válida.';
      const today = new Date();
      if (birthDate > today) return 'La fecha no puede estar en el futuro.';
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age -= 1;
      }
      if (age > 120)
        return 'Ingresa una fecha de nacimiento válida (máximo 120 años).';
      if (age < 18) return 'Debes ser mayor de 18 años para crear una cuenta.';
      return null;
    }
    case 'region':
      if (!state.region) return 'Selecciona una región.';
      return null;
    case 'comuna':
      if (!state.comuna) return 'Selecciona una comuna.';
      return null;
    case 'direccion': {
      const value = state.direccion.trim();
      if (!value) return 'Indica una dirección de entrega.';
      if (value.length > 300)
        return 'La dirección no puede superar 300 caracteres.';
      return null;
    }
    case 'password': {
      const value = state.password;
      if (!value) return 'Crea una contraseña.';
      if (value.length < 8)
        return 'La contraseña debe tener al menos 8 caracteres.';
      return null;
    }
    case 'confirmPassword': {
      const value = state.confirmPassword;
      if (!value) return 'Confirma tu contraseña.';
      if (value !== state.password) return 'Las contraseñas no coinciden.';
      return null;
    }
    case 'referralCode': {
      const value = state.referralCode.trim().toUpperCase();
      if (value && !referralCodeRegex.test(value))
        return 'El código de referido debe tener el formato LUG-XXXXXX.';
      return null;
    }
    case 'termsAccepted':
      if (!state.termsAccepted)
        return 'Debes aceptar los Términos y Condiciones.';
      return null;
    default:
      return null;
  }
};

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

  const initialFormState: RegisterForm = {
    nombre: '',
    apellidos: '',
    correo: '',
    run: '',
    fechaNacimiento: '',
    region: '',
    comuna: '',
    direccion: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    termsAccepted: false,
  };

  const [form, setForm] = useState<RegisterForm>(initialFormState);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [touched, setTouched] = useState<Record<keyof RegisterForm, boolean>>(
    () =>
      Object.keys(initialFormState).reduce(
        (acc, key) => ({
          ...acc,
          [key]: false,
        }),
        {} as Record<keyof RegisterForm, boolean>
      )
  );
  const [status, setStatus] = useState<{ type: 'error'; message: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { regions } = useRegions();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(fromPath, { replace: true });
    }
  }, [fromPath, isAuthenticated, navigate]);

  const comunasDisponibles = useMemo(() => {
    const regionSeleccionada = regions.find(
      (region) => region.nombre === form.region
    );
    return regionSeleccionada?.comunas ?? [];
  }, [form.region, regions]);

  const applyValidation = (
    nextState: RegisterForm,
    field: keyof RegisterForm
  ) => {
    const scope = new Set<keyof RegisterForm>(getValidationScope(field));
    setErrors((previous) => {
      const next = { ...previous };
      scope.forEach((key) => {
        const validation = validateField(key, nextState);
        if (validation) {
          next[key] = validation;
        } else {
          delete next[key];
        }
      });
      return next;
    });
  };

  const handleFieldChange =
    (field: EditableField) =>
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

      const nextFormState: RegisterForm = {
        ...form,
        [field]: value,
      } as RegisterForm;

      if (field === 'region') {
        nextFormState.comuna = '';
        setTouched((prev) => ({ ...prev, comuna: false }));
      }

      setForm(nextFormState);
      setTouched((prev) =>
        prev[field]
          ? prev
          : {
              ...prev,
              [field]: true,
            }
      );
      applyValidation(nextFormState, field);
      setStatus(undefined);
    };

  const handleRunBlur = (event: FocusEvent<HTMLInputElement>) => {
    const formatted = formatRun(event.target.value);
    const nextFormState: RegisterForm = { ...form, run: formatted };
    setForm(nextFormState);
    setTouched((prev) => ({ ...prev, run: true }));
    applyValidation(nextFormState, 'run');
  };

  const handleFieldBlur = (field: keyof RegisterForm) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    applyValidation(form, field);
  };

  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFormState: RegisterForm = {
      ...form,
      termsAccepted: event.target.checked,
    };
    setForm(nextFormState);
    setTouched((prev) => ({ ...prev, termsAccepted: true }));
    applyValidation(nextFormState, 'termsAccepted');
    setStatus(undefined);
  };

  const showError = (field: keyof RegisterForm): boolean =>
    Boolean(touched[field] && errors[field]);

  const showSuccess = (field: keyof RegisterForm): boolean => {
    if (!touched[field] || errors[field]) return false;
    switch (field) {
      case 'termsAccepted':
        return form.termsAccepted;
      case 'referralCode':
        return form.referralCode.trim().length > 0;
      default:
        return (form[field] as string).trim().length > 0;
    }
  };

  const inputClass = (field: keyof RegisterForm): string | undefined => {
    const classes: string[] = [];
    if (showError(field)) classes.push(styles.inputError);
    if (showSuccess(field)) classes.push(styles.inputSuccess);
    return classes.length > 0 ? classes.join(' ') : undefined;
  };

  const passwordsMatch =
    touched.confirmPassword &&
    !errors.confirmPassword &&
    form.confirmPassword.trim().length > 0;

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
    (Object.keys(form) as Array<keyof RegisterForm>).forEach((field) => {
      const result = validateField(field, form);
      if (result) {
        validationErrors[field] = result;
      }
    });
    return validationErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setTouched((previous) => {
        const next = { ...previous };
        (Object.keys(validationErrors) as Array<keyof RegisterForm>).forEach(
          (field) => {
            next[field] = true;
          }
        );
        return next;
      });
      setStatus({
        type: 'error',
        message: 'Completa los campos obligatorios resaltados.',
      });
      return;
    }

    setIsSubmitting(true);
    setStatus(undefined);
    try {
      const result = await registerUser({
        nombre: form.nombre.trim(),
        apellidos: form.apellidos.trim(),
        correo: form.correo.trim(),
        run: normalizeRun(form.run),
        fechaNacimiento: form.fechaNacimiento.trim(),
        region: form.region,
        comuna: form.comuna,
        direccion: form.direccion.trim(),
        password: form.password,
        referralCode: form.referralCode
          ? form.referralCode.trim().toUpperCase()
          : undefined,
      });
      const messageParts = [
        result.correo
          ? `Tu cuenta (${result.correo}) fue creada con éxito.`
          : 'Tu cuenta fue creada con éxito.',
      ];
      if (result.referralCode) {
        messageParts.push(`Tu código Level-Up es ${result.referralCode}.`);
      }
      messageParts.push('Inicia sesión para comenzar a jugar.');
      const successMessage = messageParts.join(' ');
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          'registrationSuccess',
          JSON.stringify({
            email: result.correo,
            refCode: result.referralCode,
          })
        );
      }
      navigate('/login', {
        replace: true,
        state: locationState?.from ? { from: locationState.from } : undefined,
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
                <div className={styles.inputWrapper}>
                  <input
                    id="nombre"
                    autoComplete="given-name"
                    value={form.nombre}
                    onChange={handleFieldChange('nombre')}
                    onBlur={handleFieldBlur('nombre')}
                    className={inputClass('nombre')}
                    required
                  />
                </div>
                <div className={styles.feedbackSlot}>
                  {showError('nombre') && (
                    <span className={styles.errorMessage}>{errors.nombre}</span>
                  )}
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="apellidos">Apellidos</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="apellidos"
                    autoComplete="family-name"
                    value={form.apellidos}
                    onChange={handleFieldChange('apellidos')}
                    onBlur={handleFieldBlur('apellidos')}
                    className={inputClass('apellidos')}
                    required
                  />
                </div>
                <div className={styles.feedbackSlot}>
                  {showError('apellidos') && (
                    <span className={styles.errorMessage}>
                      {errors.apellidos}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="correo">Correo electrónico</label>
              <div className={styles.inputWrapper}>
                <input
                  id="correo"
                  type="email"
                  autoComplete="email"
                  value={form.correo}
                  onChange={handleFieldChange('correo')}
                  onBlur={handleFieldBlur('correo')}
                  className={inputClass('correo')}
                  required
                />
              </div>
              <div className={styles.feedbackSlot}>
                {showError('correo') && (
                  <span className={styles.errorMessage}>{errors.correo}</span>
                )}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="password">Contraseña</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={handleFieldChange('password')}
                    onBlur={handleFieldBlur('password')}
                    className={inputClass('password')}
                    required
                  />
                </div>
                <div className={styles.feedbackSlot}>
                  {showError('password') && (
                    <span className={styles.errorMessage}>
                      {errors.password}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="confirmPassword">Confirmar contraseña</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={handleFieldChange('confirmPassword')}
                    onBlur={handleFieldBlur('confirmPassword')}
                    className={inputClass('confirmPassword')}
                    required
                  />
                </div>
                <div className={styles.feedbackSlot}>
                  {showError('confirmPassword') ? (
                    <span className={styles.errorMessage}>
                      {errors.confirmPassword}
                    </span>
                  ) : (
                    passwordsMatch && (
                      <span className={styles.successMessage}>
                        Las contraseñas coinciden.
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="run">RUN</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="run"
                    value={form.run}
                    onChange={handleFieldChange('run')}
                    onBlur={handleRunBlur}
                    className={inputClass('run')}
                    placeholder="12345678-9"
                    required
                  />
                </div>
                <div className={styles.feedbackSlot}>
                  {showError('run') && (
                    <span className={styles.errorMessage}>{errors.run}</span>
                  )}
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="fechaNacimiento">Fecha de nacimiento</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="fechaNacimiento"
                    type="date"
                    value={form.fechaNacimiento}
                    onChange={handleFieldChange('fechaNacimiento')}
                    onBlur={handleFieldBlur('fechaNacimiento')}
                    className={inputClass('fechaNacimiento')}
                    required
                  />
                </div>
                <div className={styles.feedbackSlot}>
                  {showError('fechaNacimiento') && (
                    <span className={styles.errorMessage}>
                      {errors.fechaNacimiento}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="referralCode">
                Código de referido (opcional)
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="referralCode"
                  value={form.referralCode}
                  onChange={handleFieldChange('referralCode')}
                  onBlur={handleFieldBlur('referralCode')}
                  className={inputClass('referralCode')}
                  placeholder="LUG-XXXXXX"
                  inputMode="text"
                  autoComplete="off"
                  aria-describedby="referralCodeHelper"
                />
              </div>
              <span id="referralCodeHelper" className={styles.helperText}>
                Si alguien te invitó, ingresa su código para desbloquear puntos
                extra.
              </span>
              <div className={styles.feedbackSlot}>
                {showError('referralCode') && (
                  <span className={styles.errorMessage}>
                    {errors.referralCode}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="region">Región</label>
                <div
                  className={`${styles.inputWrapper} ${styles.selectWrapper}`}
                >
                  <select
                    id="region"
                    value={form.region}
                    onChange={handleFieldChange('region')}
                    onBlur={handleFieldBlur('region')}
                    className={inputClass('region')}
                    required
                  >
                    <option value="" disabled>
                      Selecciona una región
                    </option>
                    {regions.map((region) => (
                      <option key={region.nombre} value={region.nombre}>
                        {region.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.feedbackSlot}>
                  {showError('region') && (
                    <span className={styles.errorMessage}>{errors.region}</span>
                  )}
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="comuna">Comuna</label>
                <div
                  className={`${styles.inputWrapper} ${styles.selectWrapper}`}
                >
                  <select
                    id="comuna"
                    value={form.comuna}
                    onChange={handleFieldChange('comuna')}
                    onBlur={handleFieldBlur('comuna')}
                    disabled={comunasDisponibles.length === 0}
                    className={inputClass('comuna')}
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
                </div>
                <div className={styles.feedbackSlot}>
                  {showError('comuna') && (
                    <span className={styles.errorMessage}>{errors.comuna}</span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="direccion">Dirección</label>
              <div className={styles.inputWrapper}>
                <input
                  id="direccion"
                  autoComplete="street-address"
                  value={form.direccion}
                  onChange={handleFieldChange('direccion')}
                  onBlur={handleFieldBlur('direccion')}
                  className={inputClass('direccion')}
                  required
                />
              </div>
              <div className={styles.feedbackSlot}>
                {showError('direccion') && (
                  <span className={styles.errorMessage}>
                    {errors.direccion}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.checkboxRow}>
              <label className={styles.checkboxLabel}>
                <input
                  id="termsAccepted"
                  type="checkbox"
                  checked={form.termsAccepted}
                  onChange={handleCheckboxChange}
                  onBlur={handleFieldBlur('termsAccepted')}
                />
                <span>Acepto los Términos y Condiciones de Level-Up.</span>
              </label>
              <div className={styles.feedbackSlot}>
                {showError('termsAccepted') && (
                  <span className={styles.errorMessage}>
                    {errors.termsAccepted}
                  </span>
                )}
              </div>
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
