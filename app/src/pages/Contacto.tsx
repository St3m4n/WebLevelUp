import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import styles from './Auth.module.css';
import { addMessage } from '@/utils/messages';

const allowedDomains = ['duoc.cl', 'profesor.duoc.cl', 'gmail.com'];

const trim = (value: string) => value.trim();

const validateEmail = (value: string) => {
  const clean = trim(value);
  if (!clean) {
    return 'Ingresa tu correo electrónico.';
  }
  if (clean.length > 100) {
    return 'Máximo 100 caracteres.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean)) {
    return 'Ingresa un correo válido.';
  }
  const domain = clean.split('@')[1]?.toLowerCase() ?? '';
  if (!allowedDomains.includes(domain)) {
    return 'Usa un correo duoc.cl, profesor.duoc.cl o gmail.com.';
  }
  return '';
};

const validateLength = (value: string, field: string, max: number): string => {
  const clean = trim(value);
  if (!clean) {
    return `Ingresa ${field}.`;
  }
  if (clean.length > max) {
    return `Máximo ${max} caracteres.`;
  }
  return '';
};

const Contacto: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  }>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mensajeLength = useMemo(() => trim(mensaje).length, [mensaje]);

  useEffect(() => {
    setStatus(undefined);
  }, [nombre, email, asunto, mensaje]);

  const handleNombreChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNombre(event.target.value);
    if (errors.nombre) {
      setErrors((prev) => ({ ...prev, nombre: '' }));
    }
  };

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: '' }));
    }
  };

  const handleAsuntoChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAsunto(event.target.value);
    if (errors.asunto) {
      setErrors((prev) => ({ ...prev, asunto: '' }));
    }
  };

  const handleMensajeChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setMensaje(event.target.value);
    if (errors.mensaje) {
      setErrors((prev) => ({ ...prev, mensaje: '' }));
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    const nombreError = validateLength(nombre, 'tu nombre', 100);
    if (nombreError) {
      nextErrors.nombre = nombreError;
    }
    const emailError = validateEmail(email);
    if (emailError) {
      nextErrors.email = emailError;
    }
    const asuntoError = validateLength(asunto, 'un asunto', 50);
    if (asuntoError) {
      nextErrors.asunto = asuntoError;
    }
    const mensajeError = validateLength(mensaje, 'un mensaje', 500);
    if (mensajeError) {
      nextErrors.mensaje = mensajeError;
    }

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setStatus({
        type: 'error',
        message: 'Revisa los campos resaltados antes de enviar.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      addMessage({
        nombre: trim(nombre),
        email: trim(email),
        asunto: trim(asunto),
        mensaje: trim(mensaje),
        createdAt: now,
      });
      setNombre('');
      setEmail('');
      setAsunto('');
      setMensaje('');
      setErrors({});
      setStatus({
        type: 'success',
        message: '¡Mensaje enviado! Te responderemos a la brevedad.',
      });
    } catch (error) {
      console.error('No se pudo guardar el mensaje de contacto', error);
      setStatus({
        type: 'error',
        message: 'No pudimos registrar tu mensaje, intenta nuevamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className={styles.page}>
        <div className={styles.contactLayout}>
          <div className={styles.formCard}>
            <div className={styles.header}>
              <h1 className={styles.title}>Comunícate con nosotros</h1>
              <p className={styles.subtitle}>
                Rellena el formulario y nuestro equipo te responderá dentro de
                las próximas 24 horas hábiles.
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
                <label htmlFor="nombre">Nombre completo</label>
                <input
                  id="nombre"
                  value={nombre}
                  onChange={handleNombreChange}
                  className={errors.nombre ? styles.inputError : undefined}
                  required
                />
                {errors.nombre && (
                  <span className={styles.errorMessage}>{errors.nombre}</span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="email">Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={errors.email ? styles.inputError : undefined}
                  required
                />
                {errors.email && (
                  <span className={styles.errorMessage}>{errors.email}</span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="asunto">Asunto</label>
                <input
                  id="asunto"
                  value={asunto}
                  onChange={handleAsuntoChange}
                  className={errors.asunto ? styles.inputError : undefined}
                  required
                />
                {errors.asunto && (
                  <span className={styles.errorMessage}>{errors.asunto}</span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="mensaje">Mensaje</label>
                <textarea
                  id="mensaje"
                  rows={5}
                  value={mensaje}
                  onChange={handleMensajeChange}
                  className={errors.mensaje ? styles.inputError : undefined}
                  required
                />
                <div className={styles.hintRow}>
                  <span className={styles.hint}>Máximo 500 caracteres.</span>
                  <span className={styles.hint}>{mensajeLength}/500</span>
                </div>
                {errors.mensaje && (
                  <span className={styles.errorMessage}>{errors.mensaje}</span>
                )}
              </div>

              <button
                type="submit"
                className={styles.primaryButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enviando…' : 'Enviar mensaje'}
              </button>
            </form>
          </div>

          <aside className={styles.mapCard} aria-labelledby="mapa-contacto">
            <div className={styles.mapHeading}>
              <h2 id="mapa-contacto">Visítanos en Santiago</h2>
              <p>
                Talleres, retiros programados y demostraciones en nuestra base
                gamer de Las Condes.
              </p>
            </div>
            <ul className={styles.infoList}>
              <li>
                <strong>Horario atención:</strong> Lunes a viernes 10:00 a 18:30
              </li>
              <li>
                <strong>Teléfono:</strong> +56 9 1234 5678
              </li>
              <li>
                <strong>Correo soporte:</strong> contacto@levelup.cl
              </li>
            </ul>
            <div className={styles.mapFrameWrapper}>
              <iframe
                title="Ubicación Level-Up Gamer"
                src="https://maps.google.com/maps?q=Duoc%20UC%20San%20Carlos%20de%20Apoquindo&t=&z=15&ie=UTF8&iwloc=&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className={styles.mapFrame}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Contacto;
