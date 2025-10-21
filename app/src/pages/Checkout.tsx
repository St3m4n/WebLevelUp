import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { regiones } from '@/data/regionesComunas';
import { formatPrice } from '@/utils/format';
import { addOrder } from '@/utils/orders';
import { addPurchasePoints } from '@/utils/levelup';
import styles from './Checkout.module.css';

type PagoMetodo = 'tarjeta' | 'transferencia';
type CheckoutForm = {
  nombre: string;
  correo: string;
  direccion: string;
  region: string;
  comuna: string;
  metodo: PagoMetodo;
  tarjeta: string;
  expiracion: string;
  cvv: string;
};

type FormErrors = Partial<Record<keyof CheckoutForm, string>>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AuthUserValue = ReturnType<typeof useAuth>['user'];

const buildInitialForm = (usuario: AuthUserValue): CheckoutForm => ({
  nombre: usuario ? `${usuario.nombre} ${usuario.apellidos}`.trim() : '',
  correo: usuario?.correo ?? '',
  direccion: usuario?.direccion ?? '',
  region: usuario?.region ?? '',
  comuna: usuario?.comuna ?? '',
  metodo: 'tarjeta',
  tarjeta: '',
  expiracion: '',
  cvv: '',
});

const Checkout: React.FC = () => {
  const {
    items,
    subtotal,
    total,
    totalSavings,
    hasDuocDiscount,
    getItemPricing,
    clearCart,
  } = useCart();
  const { user } = useAuth();
  const [form, setForm] = useState<CheckoutForm>(() => buildInitialForm(user));
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  }>();

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      nombre: user ? `${user.nombre} ${user.apellidos}`.trim() : '',
      correo: user?.correo ?? '',
      direccion: user?.direccion ?? '',
      region: user?.region ?? '',
      comuna: user?.comuna ?? '',
    }));
  }, [user]);

  const comunasDisponibles = useMemo(() => {
    const regionSeleccionada = regiones.find(
      (region) => region.nombre === form.region
    );
    return regionSeleccionada?.comunas ?? [];
  }, [form.region]);

  const cartEstaVacio = items.length === 0;

  const handleFieldChange =
    (field: keyof CheckoutForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setForm((prev) => {
        if (field === 'region') {
          return {
            ...prev,
            region: value,
            comuna: '',
          } as CheckoutForm;
        }
        if (field === 'metodo') {
          const metodo = value as PagoMetodo;
          return {
            ...prev,
            metodo,
            tarjeta: metodo === 'tarjeta' ? prev.tarjeta : '',
            expiracion: metodo === 'tarjeta' ? prev.expiracion : '',
            cvv: metodo === 'tarjeta' ? prev.cvv : '',
          } as CheckoutForm;
        }
        return {
          ...prev,
          [field]: value,
        } as CheckoutForm;
      });
      setErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        if (field === 'region') {
          delete next.comuna;
        }
        return next;
      });
      setStatus(undefined);
    };

  const validateForm = (): FormErrors => {
    const validationErrors: FormErrors = {};
    if (!form.nombre.trim()) {
      validationErrors.nombre = 'Ingresa tu nombre completo.';
    }
    if (!form.correo.trim() || !emailRegex.test(form.correo)) {
      validationErrors.correo = 'Ingresa un correo válido.';
    }
    if (!form.direccion.trim()) {
      validationErrors.direccion = 'Indica una dirección de entrega.';
    }
    if (!form.region) {
      validationErrors.region = 'Selecciona una región.';
    }
    if (!form.comuna) {
      validationErrors.comuna = 'Selecciona una comuna.';
    }
    if (form.metodo === 'tarjeta') {
      const tarjetaLimpia = form.tarjeta.replace(/\s+/g, '');
      if (!/^[0-9]{16}$/.test(tarjetaLimpia)) {
        validationErrors.tarjeta = 'La tarjeta debe tener 16 dígitos.';
      }
      if (!/^\d{2}\/\d{2}$/.test(form.expiracion)) {
        validationErrors.expiracion = 'Usa el formato MM/AA.';
      }
      if (!/^\d{3,4}$/.test(form.cvv)) {
        validationErrors.cvv = 'CVV inválido.';
      }
    }
    return validationErrors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cartEstaVacio) {
      setStatus({
        type: 'error',
        message: 'Tu carrito está vacío, agrega productos antes de pagar.',
      });
      return;
    }

    const validationErrors = validateForm();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setStatus({
        type: 'error',
        message: 'Revisa los campos destacados antes de confirmar.',
      });
      return;
    }

    const orderId = `ORD-${Date.now()}`;
    const paymentStatus =
      form.metodo === 'transferencia' ? 'Pendiente' : 'Pagado';

    addOrder({
      id: orderId,
      userEmail: form.correo.trim().toLowerCase(),
      userName: form.nombre.trim(),
      total,
      createdAt: new Date().toISOString(),
      items: items.map((item) => {
        const pricing = getItemPricing(item);
        return {
          codigo: item.id,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precioUnitario: pricing.unitFinal,
          subtotal: pricing.subtotalFinal,
        };
      }),
      paymentMethod: form.metodo,
      direccion: form.direccion.trim(),
      region: form.region,
      comuna: form.comuna,
      status: paymentStatus,
    });

    if (user?.run) {
      addPurchasePoints({ run: user.run, totalCLP: total });
    }

    clearCart();
    setStatus({
      type: 'success',
      message:
        form.metodo === 'transferencia'
          ? `Pedido ${orderId} registrado. Recuerda enviar el comprobante a pagos@levelup.cl.`
          : `Pedido ${orderId} confirmado. Te enviaremos un correo con los detalles en unos instantes.`,
    });
    setErrors({});
    setForm((prev) => ({
      ...prev,
      tarjeta: '',
      expiracion: '',
      cvv: '',
    }));
  };

  return (
    <div className="container">
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Checkout seguro</h1>
          <p>
            Revisa tus datos y confirma el pedido. Aceptamos tarjetas y
            transferencias.
          </p>
        </header>

        <div className={styles.layout}>
          <section className={styles.formSection}>
            <form onSubmit={handleSubmit} className={styles.form}>
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
              <fieldset className={styles.fieldset}>
                <legend>Datos de entrega</legend>
                <div className={styles.fieldGroup}>
                  <label htmlFor="nombre">Nombre completo</label>
                  <input
                    id="nombre"
                    value={form.nombre}
                    onChange={handleFieldChange('nombre')}
                    className={errors.nombre ? styles.inputError : undefined}
                  />
                  {errors.nombre && (
                    <span className={styles.errorMessage}>{errors.nombre}</span>
                  )}
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="correo">Correo</label>
                  <input
                    id="correo"
                    type="email"
                    value={form.correo}
                    onChange={handleFieldChange('correo')}
                    className={errors.correo ? styles.inputError : undefined}
                  />
                  {errors.correo && (
                    <span className={styles.errorMessage}>{errors.correo}</span>
                  )}
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="direccion">Dirección</label>
                  <input
                    id="direccion"
                    value={form.direccion}
                    onChange={handleFieldChange('direccion')}
                    className={errors.direccion ? styles.inputError : undefined}
                  />
                  {errors.direccion && (
                    <span className={styles.errorMessage}>
                      {errors.direccion}
                    </span>
                  )}
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="region">Región</label>
                    <select
                      id="region"
                      value={form.region}
                      onChange={handleFieldChange('region')}
                      className={errors.region ? styles.inputError : undefined}
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
                      <span className={styles.errorMessage}>
                        {errors.region}
                      </span>
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
                      <span className={styles.errorMessage}>
                        {errors.comuna}
                      </span>
                    )}
                  </div>
                </div>
              </fieldset>

              <fieldset className={styles.fieldset}>
                <legend>Método de pago</legend>
                <div className={styles.fieldGroup}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="metodo"
                      value="tarjeta"
                      checked={form.metodo === 'tarjeta'}
                      onChange={handleFieldChange('metodo')}
                    />
                    Tarjeta de crédito / débito
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="metodo"
                      value="transferencia"
                      checked={form.metodo === 'transferencia'}
                      onChange={handleFieldChange('metodo')}
                    />
                    Transferencia bancaria
                  </label>
                </div>

                {form.metodo === 'tarjeta' ? (
                  <div className={styles.fieldRow}>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="tarjeta">Número de tarjeta</label>
                      <input
                        id="tarjeta"
                        inputMode="numeric"
                        placeholder="XXXX XXXX XXXX XXXX"
                        value={form.tarjeta}
                        onChange={handleFieldChange('tarjeta')}
                        className={
                          errors.tarjeta ? styles.inputError : undefined
                        }
                      />
                      {errors.tarjeta && (
                        <span className={styles.errorMessage}>
                          {errors.tarjeta}
                        </span>
                      )}
                    </div>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="expiracion">Expiración</label>
                      <input
                        id="expiracion"
                        placeholder="MM/AA"
                        value={form.expiracion}
                        onChange={handleFieldChange('expiracion')}
                        className={
                          errors.expiracion ? styles.inputError : undefined
                        }
                      />
                      {errors.expiracion && (
                        <span className={styles.errorMessage}>
                          {errors.expiracion}
                        </span>
                      )}
                    </div>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="cvv">CVV</label>
                      <input
                        id="cvv"
                        inputMode="numeric"
                        placeholder="123"
                        value={form.cvv}
                        onChange={handleFieldChange('cvv')}
                        className={errors.cvv ? styles.inputError : undefined}
                      />
                      {errors.cvv && (
                        <span className={styles.errorMessage}>
                          {errors.cvv}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={styles.transferInfo}>
                    <p>
                      Transferir a: <strong>Level-Up Gamer SpA</strong>
                    </p>
                    <p>Cuenta corriente Banco Level-Up 12-345-678-9</p>
                    <p>
                      Enviar comprobante a{' '}
                      <a href="mailto:pagos@levelup.cl">pagos@levelup.cl</a>
                    </p>
                  </div>
                )}
              </fieldset>

              <button
                type="submit"
                className={styles.confirmButton}
                disabled={cartEstaVacio}
              >
                Confirmar pedido
              </button>
            </form>
          </section>

          <aside className={styles.summary}>
            <h2>Resumen</h2>
            {items.length === 0 ? (
              <p>
                No hay productos. <Link to="/tienda">Explorar tienda</Link>
              </p>
            ) : (
              <div className={styles.summaryList}>
                {items.map((item) => {
                  const pricing = getItemPricing(item);
                  return (
                    <div key={item.id} className={styles.summaryRow}>
                      <div>
                        <p>{item.nombre}</p>
                        <span>Cantidad: {item.cantidad}</span>
                      </div>
                      {pricing.hasDiscount ? (
                        <span className={styles.priceWithDiscount}>
                          <span className={styles.priceOriginal}>
                            {formatPrice(pricing.subtotalBase)}
                          </span>
                          <strong className={styles.priceFinal}>
                            {formatPrice(pricing.subtotalFinal)}
                          </strong>
                        </span>
                      ) : (
                        <strong className={styles.priceFinal}>
                          {formatPrice(pricing.subtotalFinal)}
                        </strong>
                      )}
                    </div>
                  );
                })}
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span
                    className={
                      hasDuocDiscount ? styles.priceOriginal : styles.priceFinal
                    }
                  >
                    {formatPrice(subtotal)}
                  </span>
                </div>
                {hasDuocDiscount && totalSavings > 0 && (
                  <div className={styles.summaryRow}>
                    <span>Descuento DUOC</span>
                    <span className={styles.savingsAmount}>
                      −{formatPrice(totalSavings)}
                    </span>
                  </div>
                )}
                <div className={styles.summaryRow}>
                  <span>Envío</span>
                  <strong>Por calcular</strong>
                </div>
                <div className={styles.totalRow}>
                  <span>Total a pagar</span>
                  <strong className={styles.priceFinal}>
                    {formatPrice(total)}
                  </strong>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
