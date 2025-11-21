import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { regiones } from '@/data/regionesComunas';
import { useLevelUpStats } from '@/hooks/useLevelUpStats';
import type { Order, PaymentPreferenceMethod, UserAddress } from '@/types';
import { formatPrice } from '@/utils/format';
import { loadOrders, subscribeToOrders } from '@/utils/orders';
import styles from './Perfil.module.css';

type ProfileFormState = {
  nombre: string;
  apellidos: string;
  region: string;
  comuna: string;
  direccion: string;
};

type AddressFormState = {
  id?: string;
  fullName: string;
  line1: string;
  city: string;
  region: string;
  country: string;
  isPrimary: boolean;
};

type EditableField = 'nombre' | 'apellidos' | 'direccion' | 'ubicacion';
type ProfileTab =
  | 'orders'
  | 'details'
  | 'addresses'
  | 'preferences'
  | 'referrals';

const createEmptyAddressForm = (): AddressFormState => ({
  fullName: '',
  line1: '',
  city: '',
  region: '',
  country: 'Chile',
  isPrimary: false,
});

const PAYMENT_METHOD_OPTIONS: Array<{
  value: PaymentPreferenceMethod;
  label: string;
  helper: string;
}> = [
  {
    value: 'tarjeta',
    label: 'Tarjeta de crédito o débito',
    helper: 'Pagos instantáneos y acumulación de EXP al momento de finalizar.',
  },
  {
    value: 'transferencia',
    label: 'Transferencia bancaria',
    helper:
      'Recibirás instrucciones para realizar la transferencia y confirmar tu pago.',
  },
  {
    value: 'efectivo',
    label: 'Pago en tienda (efectivo)',
    helper: 'Reserva productos y paga al retirarlos en la tienda Level-Up.',
  },
];

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export const maskEmail = (email: string): string => {
  const [userPart, domainPart] = email.split('@');
  if (!userPart || !domainPart) return email;
  if (userPart.length <= 2) {
    return `${userPart[0] ?? ''}***@${domainPart}`;
  }
  const head = userPart.slice(0, 2);
  return `${head}***@${domainPart}`;
};

type ReferralListEntry = {
  email: string;
  dateLabel: string;
};

type ReferralTabContentProps = {
  panelId: string;
  labelId: string;
  referralCode: string;
  referralLink: string;
  referralCount: number;
  referrals: ReferralListEntry[];
  referralFeedback: string | null;
  onCopy: () => void;
  onShare: () => void;
  maskEmailFn?: (email: string) => string;
};

export const ReferralTabContent: React.FC<ReferralTabContentProps> = ({
  panelId,
  labelId,
  referralCode,
  referralLink,
  referralCount,
  referrals,
  referralFeedback,
  onCopy,
  onShare,
  maskEmailFn,
}) => {
  const applyMask = maskEmailFn ?? maskEmail;

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={labelId}
      className={styles.tabPanel}
    >
      <h2 className={styles.tabTitle}>Referidos Level-Up</h2>
      <p className={styles.tabDescription}>
        Comparte tu código y gana EXP adicional junto a tus amigos.
      </p>

      <div className={styles.referralSection}>
        <div className={styles.referralHeader}>
          <h3 className={styles.subsectionTitle}>Tu código</h3>
          <span className={styles.referralCounter}>
            {`${referralCount} ${referralCount === 1 ? 'referido' : 'referidos'}`}
          </span>
        </div>
        <div className={styles.referralInputGroup}>
          <input
            className={styles.referralInput}
            value={referralCode || 'Disponible al iniciar sesión'}
            readOnly
            aria-label="Código de referido"
          />
          <button
            type="button"
            className={styles.referralButton}
            onClick={onCopy}
            disabled={!referralCode}
          >
            Copiar código
          </button>
          <button
            type="button"
            className={styles.referralButton}
            onClick={onShare}
            disabled={!referralLink}
          >
            Compartir enlace
          </button>
        </div>
        {referralFeedback && (
          <p className={styles.referralFeedback}>{referralFeedback}</p>
        )}
        <p className={styles.referralHint}>
          Cada registro con tu código suma 100 EXP para ambos jugadores.
        </p>
      </div>

      <div className={styles.referralListSection}>
        <h3 className={styles.subsectionTitle}>Historial de referidos</h3>
        {referrals.length === 0 ? (
          <p className={styles.referralEmpty}>
            Aún no sumas referidos. ¡Comparte tu código con tu squad!
          </p>
        ) : (
          <ul className={styles.referralList}>
            {referrals.map((referral) => (
              <li key={referral.email} className={styles.referralListItem}>
                <span className={styles.referralEmail}>
                  {applyMask(referral.email)}
                </span>
                <span className={styles.referralDate}>
                  {referral.dateLabel || 'Reciente'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const Perfil: React.FC = () => {
  const {
    user,
    logout,
    profileOverrides,
    updateProfile,
    clearProfileOverrides,
    addresses,
    addAddress,
    updateAddress,
    removeAddress,
    setPrimaryAddress,
  } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>(() => loadOrders());
  const levelUp = useLevelUpStats();
  const pointsFormatter = useMemo(() => new Intl.NumberFormat('es-CL'), []);
  const referralDateFormatter = useMemo(
    () => new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }),
    []
  );
  const memberSinceFormatter = useMemo(
    () => new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }),
    []
  );
  const [referralFeedback, setReferralFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('orders');
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    nombre: '',
    apellidos: '',
    region: '',
    comuna: '',
    direccion: '',
  });
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [savingField, setSavingField] = useState<EditableField | null>(null);
  const [paymentPreference, setPaymentPreference] = useState<
    PaymentPreferenceMethod | ''
  >('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressFormState>(() =>
    createEmptyAddressForm()
  );
  const [addressMode, setAddressMode] = useState<'create' | 'edit'>('create');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToOrders(() => {
      setOrders(loadOrders());
    });
    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfileForm({
        nombre: '',
        apellidos: '',
        region: '',
        comuna: '',
        direccion: '',
      });
      setPaymentPreference('');
      setAddressForm(createEmptyAddressForm());
      setAddressMode('create');
      return;
    }
    setProfileForm({
      nombre: profileOverrides.nombre ?? user.nombre ?? '',
      apellidos: profileOverrides.apellidos ?? user.apellidos ?? '',
      region: profileOverrides.region ?? user.region ?? '',
      comuna: profileOverrides.comuna ?? user.comuna ?? '',
      direccion: profileOverrides.direccion ?? user.direccion ?? '',
    });
    setPaymentPreference(
      profileOverrides.preferencias?.defaultPaymentMethod ?? ''
    );
  }, [profileOverrides, user]);

  useEffect(() => {
    if (addressMode === 'edit' && addressForm.id) {
      const exists = addresses.some((item) => item.id === addressForm.id);
      if (!exists) {
        setAddressMode('create');
        setAddressForm(createEmptyAddressForm());
      }
    }
  }, [addressForm.id, addressMode, addresses]);

  const userOrders = useMemo(() => {
    if (!user) return [];
    const correo = user.correo.toLowerCase();
    return orders
      .filter((order) => order.userEmail.toLowerCase() === correo)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [orders, user]);

  const totalGastado = useMemo(() => {
    return userOrders.reduce((sum, order) => sum + order.total, 0);
  }, [userOrders]);

  const referralCode = levelUp.stats?.referralCode ?? '';

  const referralLink = useMemo(() => {
    if (!referralCode) return '';
    if (typeof window === 'undefined') return '';
    const origin = window.location?.origin ?? '';
    return `${origin}/registro?ref=${referralCode}`;
  }, [referralCode]);

  const referrals = useMemo(() => {
    const users = levelUp.stats?.referidos?.users ?? [];
    return users
      .map((entry) => {
        const email = entry.email ?? '';
        if (!email) {
          return { email: '', dateLabel: '', timestamp: 0 };
        }
        const date = entry.date ? new Date(entry.date) : null;
        const timestamp =
          date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
        const dateLabel =
          date && !Number.isNaN(date.getTime())
            ? referralDateFormatter.format(date)
            : '';
        return { email, dateLabel, timestamp };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [levelUp.stats, referralDateFormatter]);

  const referralCount = levelUp.stats?.referidos?.count ?? referrals.length;
  const totalExp = levelUp.totalExp;
  const totalPoints = levelUp.stats?.points ?? totalExp;
  const expToNextLevel = Math.max(
    0,
    levelUp.nextLevelExp - levelUp.currentExpIntoLevel
  );

  const availableComunas = useMemo(() => {
    if (!profileForm.region) return [];
    const regionMatch = regiones.find(
      (entry) => entry.nombre === profileForm.region
    );
    return regionMatch
      ? regionMatch.comunas.map((comuna) => comuna.nombre)
      : [];
  }, [profileForm.region]);

  const addressAvailableComunas = useMemo(() => {
    if (!addressForm.region) return [];
    const regionMatch = regiones.find(
      (entry) => entry.nombre === addressForm.region
    );
    return regionMatch
      ? regionMatch.comunas.map((comuna) => comuna.nombre)
      : [];
  }, [addressForm.region]);

  const addressComunaOptions = useMemo(() => {
    if (!addressForm.city) {
      return addressAvailableComunas;
    }
    if (addressAvailableComunas.includes(addressForm.city)) {
      return addressAvailableComunas;
    }
    return [addressForm.city, ...addressAvailableComunas];
  }, [addressAvailableComunas, addressForm.city]);

  const persistedProfile = useMemo<ProfileFormState>(() => {
    if (!user) {
      return {
        nombre: '',
        apellidos: '',
        region: '',
        comuna: '',
        direccion: '',
      };
    }
    return {
      nombre: profileOverrides.nombre ?? user.nombre ?? '',
      apellidos: profileOverrides.apellidos ?? user.apellidos ?? '',
      region: profileOverrides.region ?? user.region ?? '',
      comuna: profileOverrides.comuna ?? user.comuna ?? '',
      direccion: profileOverrides.direccion ?? user.direccion ?? '',
    };
  }, [profileOverrides, user]);

  const overridesUpdatedAtLabel = useMemo(() => {
    if (!profileOverrides.updatedAt) return '';
    const updatedDate = new Date(profileOverrides.updatedAt);
    if (Number.isNaN(updatedDate.getTime())) return '';
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(updatedDate);
  }, [profileOverrides.updatedAt]);

  const hasCustomProfile = useMemo(
    () =>
      Boolean(
        profileOverrides.nombre ||
          profileOverrides.apellidos ||
          profileOverrides.region ||
          profileOverrides.comuna ||
          profileOverrides.direccion ||
          profileOverrides.preferencias?.defaultPaymentMethod
      ),
    [profileOverrides]
  );

  const gamerSinceLabel = useMemo(() => {
    if (!user?.fechaNacimiento) return '';
    const parsed = new Date(user.fechaNacimiento);
    if (Number.isNaN(parsed.getTime())) return '';
    return memberSinceFormatter.format(parsed);
  }, [memberSinceFormatter, user]);

  const addressFormTitle =
    addressMode === 'edit' ? 'Editar dirección' : 'Agregar nueva dirección';

  const addressSubmitLabel =
    addressMode === 'edit' ? 'Actualizar dirección' : 'Guardar dirección';

  const handleGoShop = () => {
    navigate('/tienda');
  };

  const handleGoAdmin = () => {
    navigate('/admin');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    if (!referralFeedback) return;
    const timeout = window.setTimeout(() => {
      setReferralFeedback(null);
    }, 3000);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [referralFeedback]);

  const handleProfileFieldChange = useCallback(
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value } = event.target;
      const field = name as keyof ProfileFormState;
      setProfileForm((previous) => {
        const next = { ...previous, [field]: value } as ProfileFormState;
        if (field === 'region' && value !== previous.region) {
          next.comuna = '';
        }
        return next;
      });
    },
    []
  );

  const handleStartEditing = useCallback(
    (field: EditableField) => {
      setProfileForm({ ...persistedProfile });
      setEditingField(field);
    },
    [persistedProfile]
  );

  const handleCancelEditing = useCallback(() => {
    setProfileForm({ ...persistedProfile });
    setEditingField(null);
  }, [persistedProfile]);

  const handleSaveField = useCallback(
    async (field: EditableField) => {
      if (!user) return;
      const normalizeOptional = (value: string) => {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
      };

      const submitPatch = async () => {
        switch (field) {
          case 'nombre': {
            const value = profileForm.nombre.trim();
            if (!value) {
              addToast({
                variant: 'warning',
                title: 'Falta tu nombre',
                description: 'Ingresa tu nombre para poder guardarlo.',
              });
              return false;
            }
            await updateProfile({ nombre: value });
            return true;
          }
          case 'apellidos': {
            const value = profileForm.apellidos.trim();
            if (!value) {
              addToast({
                variant: 'warning',
                title: 'Faltan tus apellidos',
                description: 'Ingresa tus apellidos para poder guardarlos.',
              });
              return false;
            }
            await updateProfile({ apellidos: value });
            return true;
          }
          case 'direccion': {
            await updateProfile({
              direccion: normalizeOptional(profileForm.direccion),
            });
            return true;
          }
          case 'ubicacion': {
            const region = profileForm.region.trim();
            const comuna = profileForm.comuna.trim();
            if (!region) {
              addToast({
                variant: 'warning',
                title: 'Selecciona una región',
                description: 'Indica la región antes de guardar tu ubicación.',
              });
              return false;
            }
            if (!comuna) {
              addToast({
                variant: 'warning',
                title: 'Selecciona una comuna',
                description: 'Indica la comuna antes de guardar tu ubicación.',
              });
              return false;
            }
            await updateProfile({ region, comuna });
            return true;
          }
          default:
            return false;
        }
      };

      setSavingField(field);
      try {
        const updated = await submitPatch();
        if (!updated) {
          return;
        }
        addToast({
          variant: 'success',
          title: 'Cambios guardados',
          description: 'Actualizamos tu información.',
        });
        setEditingField(null);
      } catch (error) {
        addToast({
          variant: 'error',
          title: 'No se pudo guardar el cambio',
          description:
            error instanceof Error
              ? error.message
              : 'Intenta nuevamente en unos segundos.',
        });
      } finally {
        setSavingField(null);
      }
    },
    [addToast, profileForm, updateProfile, user]
  );

  const handleTabClick = useCallback((tab: ProfileTab) => {
    setActiveTab(tab);
  }, []);

  const handleResetProfile = useCallback(async () => {
    if (!user) return;
    try {
      await clearProfileOverrides();
      setProfileForm({
        nombre: user.nombre ?? '',
        apellidos: user.apellidos ?? '',
        region: user.region ?? '',
        comuna: user.comuna ?? '',
        direccion: user.direccion ?? '',
      });
      setEditingField(null);
      setPaymentPreference('');
      addToast({
        variant: 'info',
        title: 'Datos restablecidos',
        description:
          'Recuperamos la información original registrada en Level-Up.',
      });
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'No se pudo restablecer tu información',
        description:
          error instanceof Error
            ? error.message
            : 'Intenta nuevamente en unos segundos.',
      });
    }
  }, [addToast, clearProfileOverrides, user]);

  const paymentHelper = useMemo(() => {
    if (!paymentPreference) return '';
    return (
      PAYMENT_METHOD_OPTIONS.find(
        (option) => option.value === paymentPreference
      )?.helper ?? ''
    );
  }, [paymentPreference]);

  const handlePaymentPreferenceChange = useCallback(
    async (event: ChangeEvent<HTMLSelectElement>) => {
      if (!user) return;
      const value = event.target.value as PaymentPreferenceMethod | '';
      setPaymentPreference(value);
      setIsSavingPayment(true);
      try {
        if (value) {
          await updateProfile({
            preferencias: { defaultPaymentMethod: value },
          });
        } else {
          await updateProfile({ preferencias: {} });
        }
        addToast({
          variant: 'success',
          title: 'Preferencia actualizada',
          description: value
            ? 'Usaremos este método por defecto en tus compras.'
            : 'Eliminamos tu preferencia de pago.',
        });
      } catch (error) {
        addToast({
          variant: 'error',
          title: 'No se pudo guardar la preferencia',
          description:
            error instanceof Error
              ? error.message
              : 'Intenta nuevamente en unos segundos.',
        });
        setPaymentPreference(
          profileOverrides.preferencias?.defaultPaymentMethod ?? ''
        );
      } finally {
        setIsSavingPayment(false);
      }
    },
    [addToast, profileOverrides.preferencias, updateProfile, user]
  );

  const handleAddressFieldChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      const field = name as keyof AddressFormState;
      if (field === 'isPrimary') {
        if (event.target instanceof HTMLInputElement) {
          const isChecked = event.target.checked;
          setAddressForm((previous) => ({
            ...previous,
            isPrimary: isChecked,
          }));
        }
        return;
      }
      setAddressForm((previous) => {
        const next: AddressFormState = {
          ...previous,
          [field]: value,
        };
        if (field === 'region' && value !== previous.region) {
          next.city = '';
        }
        return next;
      });
    },
    []
  );

  const handleCancelAddressEdit = useCallback(() => {
    setAddressMode('create');
    setAddressForm(createEmptyAddressForm());
  }, []);

  const handleAddressSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!user) return;
      setIsSavingAddress(true);
      const sanitized = {
        fullName: addressForm.fullName.trim(),
        line1: addressForm.line1.trim(),
        city: addressForm.city.trim(),
        region: addressForm.region.trim(),
        country: addressForm.country.trim() || 'Chile',
        isPrimary: addressForm.isPrimary,
      };
      if (!sanitized.fullName || !sanitized.line1) {
        addToast({
          variant: 'warning',
          title: 'Faltan datos en la dirección',
          description:
            'Ingresa un nombre de contacto y la dirección principal para continuar.',
        });
        setIsSavingAddress(false);
        return;
      }
      if (!sanitized.region || !sanitized.city) {
        addToast({
          variant: 'warning',
          title: 'Completa la ubicación',
          description:
            'Selecciona una región y comuna para guardar la dirección.',
        });
        setIsSavingAddress(false);
        return;
      }
      try {
        if (addressMode === 'edit' && addressForm.id) {
          await updateAddress(addressForm.id, sanitized);
          addToast({
            variant: 'success',
            title: 'Dirección actualizada',
            description: 'Guardamos los cambios en tu dirección.',
          });
        } else {
          await addAddress(sanitized);
          addToast({
            variant: 'success',
            title: 'Dirección guardada',
            description: 'Agregamos la nueva dirección a tu perfil.',
          });
        }
        handleCancelAddressEdit();
      } catch (error) {
        addToast({
          variant: 'error',
          title: 'No se pudo guardar la dirección',
          description:
            error instanceof Error
              ? error.message
              : 'Inténtalo nuevamente en unos segundos.',
        });
      } finally {
        setIsSavingAddress(false);
      }
    },
    [
      addAddress,
      addToast,
      addressForm,
      addressMode,
      handleCancelAddressEdit,
      updateAddress,
      user,
    ]
  );

  const handleEditAddress = useCallback((address: UserAddress) => {
    setAddressMode('edit');
    setAddressForm({
      id: address.id,
      fullName: address.fullName,
      line1: address.line1,
      city: address.city,
      region: address.region,
      country: address.country,
      isPrimary: address.isPrimary,
    });
  }, []);

  const handleDeleteAddress = useCallback(
    async (id: string) => {
      if (!user) return;
      const target = addresses.find((address) => address.id === id);
      if (!target) return;
      const confirmed = window.confirm(
        `¿Eliminar la dirección "${target.line1}"?`
      );
      if (!confirmed) return;
      setIsSavingAddress(true);
      try {
        await removeAddress(id);
        addToast({
          variant: 'info',
          title: 'Dirección eliminada',
          description: 'Ya no usaremos esta dirección en tus pedidos.',
        });
        if (addressMode === 'edit' && addressForm.id === id) {
          handleCancelAddressEdit();
        }
      } catch (error) {
        addToast({
          variant: 'error',
          title: 'No se pudo eliminar la dirección',
          description:
            error instanceof Error
              ? error.message
              : 'Intenta nuevamente más tarde.',
        });
      } finally {
        setIsSavingAddress(false);
      }
    },
    [
      addToast,
      addressForm.id,
      addressMode,
      addresses,
      handleCancelAddressEdit,
      removeAddress,
      user,
    ]
  );

  const handleSetPrimaryAddressClick = useCallback(
    async (id: string) => {
      if (!user) return;
      setIsSavingAddress(true);
      try {
        await setPrimaryAddress(id);
        addToast({
          variant: 'success',
          title: 'Dirección principal actualizada',
          description: 'Usaremos esta dirección por defecto en tus compras.',
        });
      } catch (error) {
        addToast({
          variant: 'error',
          title: 'No se pudo actualizar la dirección principal',
          description:
            error instanceof Error
              ? error.message
              : 'Intenta nuevamente en unos segundos.',
        });
      } finally {
        setIsSavingAddress(false);
      }
    },
    [addToast, setPrimaryAddress, user]
  );

  const handleCopyCode = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setReferralFeedback('Código copiado. ¡Comparte y gana EXP extra!');
    } catch (error) {
      console.warn('No se pudo copiar el código de referido', error);
      setReferralFeedback(
        'No pudimos copiar automáticamente. Copia el código manualmente.'
      );
    }
  };

  const handleShareReferral = async () => {
    if (!referralLink) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Únete a Level-Up Gamer',
          text: 'Regístrate con mi código y suma puntos al instante.',
          url: referralLink,
        });
        setReferralFeedback(
          '¡Link compartido! Gracias por invitar a tu squad.'
        );
        return;
      }
    } catch (error) {
      const isAbortError =
        error instanceof DOMException && error.name === 'AbortError';
      if (isAbortError) {
        return;
      }
      console.warn('No se pudo compartir el link de referido', error);
    }
    try {
      await navigator.clipboard.writeText(referralLink);
      setReferralFeedback('Link copiado al portapapeles.');
    } catch (error) {
      console.warn('No se pudo copiar el link de referido', error);
      setReferralFeedback('No pudimos copiar el link automáticamente.');
    }
  };

  if (!user) {
    return null;
  }

  const fullName = [user.nombre, user.apellidos].filter(Boolean).join(' ');
  const isAdminUser =
    user.perfil === 'Administrador' || user.perfil === 'Vendedor';
  const tabItems: Array<{ key: ProfileTab; label: string }> = [
    { key: 'orders', label: 'Pedidos' },
    { key: 'details', label: 'Datos personales' },
    { key: 'addresses', label: 'Direcciones' },
    { key: 'preferences', label: 'Preferencias' },
    { key: 'referrals', label: 'Referidos' },
  ];
  const locationLabel =
    [persistedProfile.region, persistedProfile.comuna]
      .filter(Boolean)
      .join(' · ') || 'Sin registro';
  const loyaltyExpRemaining =
    levelUp.nextLevelExp > 0 ? pointsFormatter.format(expToNextLevel) : '';

  return (
    <div className="container">
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Mi perfil</h1>
          <p className={styles.subtitle}>
            Gestiona tus datos personales, pedidos y beneficios Level-Up desde
            un solo lugar.
          </p>
        </header>

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <section
              className={`${styles.card} ${styles.summaryCard}`}
              aria-labelledby="perfil-resumen"
            >
              <div className={styles.profileMeta}>
                <div className={styles.avatar} aria-hidden="true">
                  {(fullName || user.correo).charAt(0).toUpperCase()}
                </div>
                <strong id="perfil-resumen" className={styles.metaValue}>
                  {fullName || user.correo}
                </strong>
                <span className={styles.metaEmail}>{user.correo}</span>
                <span className={styles.memberSince}>
                  Gamer desde:{' '}
                  <strong>{gamerSinceLabel || 'Sin registro'}</strong>
                </span>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={handleGoShop}
                >
                  Ir a la tienda
                </button>
                {isAdminUser && (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={handleGoAdmin}
                  >
                    Panel admin
                  </button>
                )}
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
            </section>

            <section
              className={`${styles.card} ${styles.loyaltyCard}`}
              aria-labelledby="perfil-levelup"
            >
              <div className={styles.loyaltyHeader}>
                <div>
                  <h2 id="perfil-levelup" className={styles.loyaltyTitle}>
                    Progreso Level-Up
                  </h2>
                  <p className={styles.loyaltySubtitle}>
                    {pointsFormatter.format(totalPoints)} puntos ·{' '}
                    {pointsFormatter.format(totalExp)} EXP acumulados
                  </p>
                </div>
                <span className={styles.levelBadge}>Lv. {levelUp.level}</span>
              </div>

              <div
                className={styles.progressBar}
                role="progressbar"
                aria-valuenow={Math.round(levelUp.progressPct)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${Math.max(0, Math.min(100, levelUp.progressPct))}%`,
                  }}
                />
              </div>
              <p className={styles.progressMeta}>
                {levelUp.nextLevelExp > 0 ? (
                  <>
                    Te faltan {loyaltyExpRemaining} EXP para subir de nivel.
                    <span>
                      {pointsFormatter.format(levelUp.currentExpIntoLevel)} /{' '}
                      {pointsFormatter.format(levelUp.nextLevelExp)} EXP
                    </span>
                  </>
                ) : (
                  <>Has alcanzado el nivel máximo disponible.</>
                )}
              </p>

              <div className={styles.loyaltyStats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>EXP compras</span>
                  <span className={styles.statValue}>
                    {pointsFormatter.format(levelUp.stats?.exp?.compras ?? 0)}
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>EXP torneos</span>
                  <span className={styles.statValue}>
                    {pointsFormatter.format(levelUp.stats?.exp?.torneos ?? 0)}
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>EXP referidos</span>
                  <span className={styles.statValue}>
                    {pointsFormatter.format(levelUp.stats?.exp?.referidos ?? 0)}
                  </span>
                </div>
              </div>
            </section>
          </aside>

          <section className={`${styles.card} ${styles.tabCard}`}>
            <nav className={styles.tabList} role="tablist">
              {tabItems.map(({ key, label }) => (
                <button
                  key={key}
                  id={`tab-trigger-${key}`}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === key}
                  aria-controls={`tab-panel-${key}`}
                  className={[
                    styles.tabButton,
                    activeTab === key ? styles.tabButtonActive : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleTabClick(key)}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className={styles.tabPanels}>
              {activeTab === 'orders' && (
                <div
                  id="tab-panel-orders"
                  role="tabpanel"
                  aria-labelledby="tab-trigger-orders"
                  className={styles.tabPanel}
                >
                  <h2 className={styles.tabTitle}>Historial de pedidos</h2>
                  <p className={styles.tabDescription}>
                    Has realizado {userOrders.length} pedidos por un total de{' '}
                    <strong>{formatPrice(totalGastado)}</strong>.
                  </p>
                  {userOrders.length === 0 ? (
                    <div className={styles.ordersEmpty}>
                      Aún no registras compras. ¡Explora la tienda y encuentra
                      tu próximo setup!
                    </div>
                  ) : (
                    <div className={styles.ordersTableWrapper}>
                      <table className={styles.ordersTable}>
                        <thead>
                          <tr>
                            <th scope="col">Pedido</th>
                            <th scope="col">Fecha</th>
                            <th scope="col">Total</th>
                            <th scope="col">Productos</th>
                            <th scope="col">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userOrders.map((order) => {
                            const itemsCount = order.items.reduce(
                              (sum, item) => sum + item.cantidad,
                              0
                            );
                            const formattedDate = dateFormatter.format(
                              new Date(order.createdAt)
                            );
                            return (
                              <tr key={order.id}>
                                <td>{order.id}</td>
                                <td>{formattedDate}</td>
                                <td>{formatPrice(order.total)}</td>
                                <td>{itemsCount}</td>
                                <td>{order.status}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'details' && (
                <div
                  id="tab-panel-details"
                  role="tabpanel"
                  aria-labelledby="tab-trigger-details"
                  className={styles.tabPanel}
                >
                  <h2 className={styles.tabTitle}>Datos personales</h2>
                  <p className={styles.tabDescription}>
                    Edita cada dato con el botón correspondiente. Guardamos tus
                    cambios al instante.
                  </p>

                  <div className={styles.detailGroup}>
                    <div className={styles.detailRow}>
                      <div className={styles.detailContent}>
                        <span className={styles.detailLabel}>Nombre</span>
                        {editingField === 'nombre' ? (
                          <input
                            className={styles.inlineInput}
                            name="nombre"
                            value={profileForm.nombre}
                            onChange={handleProfileFieldChange}
                            autoComplete="given-name"
                          />
                        ) : (
                          <span className={styles.detailValue}>
                            {persistedProfile.nombre || 'Sin registro'}
                          </span>
                        )}
                      </div>
                      <div className={styles.detailActions}>
                        {editingField === 'nombre' ? (
                          <>
                            <button
                              type="button"
                              className={styles.inlineButtonPrimary}
                              onClick={() => handleSaveField('nombre')}
                              disabled={savingField === 'nombre'}
                            >
                              {savingField === 'nombre'
                                ? 'Guardando...'
                                : 'Guardar'}
                            </button>
                            <button
                              type="button"
                              className={styles.inlineButton}
                              onClick={handleCancelEditing}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className={styles.inlineButton}
                            onClick={() => handleStartEditing('nombre')}
                            disabled={Boolean(editingField)}
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={styles.detailRow}>
                      <div className={styles.detailContent}>
                        <span className={styles.detailLabel}>Apellidos</span>
                        {editingField === 'apellidos' ? (
                          <input
                            className={styles.inlineInput}
                            name="apellidos"
                            value={profileForm.apellidos}
                            onChange={handleProfileFieldChange}
                            autoComplete="family-name"
                          />
                        ) : (
                          <span className={styles.detailValue}>
                            {persistedProfile.apellidos || 'Sin registro'}
                          </span>
                        )}
                      </div>
                      <div className={styles.detailActions}>
                        {editingField === 'apellidos' ? (
                          <>
                            <button
                              type="button"
                              className={styles.inlineButtonPrimary}
                              onClick={() => handleSaveField('apellidos')}
                              disabled={savingField === 'apellidos'}
                            >
                              {savingField === 'apellidos'
                                ? 'Guardando...'
                                : 'Guardar'}
                            </button>
                            <button
                              type="button"
                              className={styles.inlineButton}
                              onClick={handleCancelEditing}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className={styles.inlineButton}
                            onClick={() => handleStartEditing('apellidos')}
                            disabled={Boolean(editingField)}
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={styles.detailRow}>
                      <div className={styles.detailContent}>
                        <span className={styles.detailLabel}>Ubicación</span>
                        {editingField === 'ubicacion' ? (
                          <div className={styles.inlineEditor}>
                            <select
                              className={styles.inlineSelect}
                              name="region"
                              value={profileForm.region}
                              onChange={handleProfileFieldChange}
                            >
                              <option value="">Selecciona una región</option>
                              {regiones.map((region) => (
                                <option
                                  key={region.nombre}
                                  value={region.nombre}
                                >
                                  {region.nombre}
                                </option>
                              ))}
                            </select>
                            <select
                              className={styles.inlineSelect}
                              name="comuna"
                              value={profileForm.comuna}
                              onChange={handleProfileFieldChange}
                              disabled={availableComunas.length === 0}
                            >
                              <option value="">
                                {availableComunas.length > 0
                                  ? 'Selecciona una comuna'
                                  : 'Primero elige una región'}
                              </option>
                              {availableComunas.map((comuna) => (
                                <option key={comuna} value={comuna}>
                                  {comuna}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className={styles.detailValue}>
                            {locationLabel}
                          </span>
                        )}
                      </div>
                      <div className={styles.detailActions}>
                        {editingField === 'ubicacion' ? (
                          <>
                            <button
                              type="button"
                              className={styles.inlineButtonPrimary}
                              onClick={() => handleSaveField('ubicacion')}
                              disabled={savingField === 'ubicacion'}
                            >
                              {savingField === 'ubicacion'
                                ? 'Guardando...'
                                : 'Guardar'}
                            </button>
                            <button
                              type="button"
                              className={styles.inlineButton}
                              onClick={handleCancelEditing}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className={styles.inlineButton}
                            onClick={() => handleStartEditing('ubicacion')}
                            disabled={Boolean(editingField)}
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={styles.detailRow}>
                      <div className={styles.detailContent}>
                        <span className={styles.detailLabel}>Dirección</span>
                        {editingField === 'direccion' ? (
                          <textarea
                            className={styles.inlineTextarea}
                            name="direccion"
                            value={profileForm.direccion}
                            onChange={handleProfileFieldChange}
                            rows={2}
                            placeholder="Ej. Av. Gamer 1337, depto 205"
                          />
                        ) : (
                          <span className={styles.detailValue}>
                            {persistedProfile.direccion || 'Sin registro'}
                          </span>
                        )}
                      </div>
                      <div className={styles.detailActions}>
                        {editingField === 'direccion' ? (
                          <>
                            <button
                              type="button"
                              className={styles.inlineButtonPrimary}
                              onClick={() => handleSaveField('direccion')}
                              disabled={savingField === 'direccion'}
                            >
                              {savingField === 'direccion'
                                ? 'Guardando...'
                                : 'Guardar'}
                            </button>
                            <button
                              type="button"
                              className={styles.inlineButton}
                              onClick={handleCancelEditing}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className={styles.inlineButton}
                            onClick={() => handleStartEditing('direccion')}
                            disabled={Boolean(editingField)}
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={styles.detailRow} aria-disabled="true">
                      <div className={styles.detailContent}>
                        <span className={styles.detailLabel}>Correo</span>
                        <span className={styles.detailValue}>
                          {user.correo}
                        </span>
                      </div>
                      <div className={styles.detailActions}>
                        <span className={styles.detailHint}>No editable</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.detailFooter}>
                    {overridesUpdatedAtLabel && (
                      <p className={styles.helperText}>
                        Última actualización {overridesUpdatedAtLabel}
                      </p>
                    )}
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={handleResetProfile}
                      disabled={!hasCustomProfile || Boolean(savingField)}
                    >
                      Restablecer datos
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'addresses' && (
                <div
                  id="tab-panel-addresses"
                  role="tabpanel"
                  aria-labelledby="tab-trigger-addresses"
                  className={styles.tabPanel}
                >
                  <h2 className={styles.tabTitle}>Direcciones</h2>
                  <p className={styles.tabDescription}>
                    Guarda direcciones para acelerar tus pedidos y marca una
                    como principal.
                  </p>

                  <form
                    className={styles.addressForm}
                    onSubmit={handleAddressSubmit}
                  >
                    <h3 className={styles.formSectionTitle}>
                      {addressFormTitle}
                    </h3>
                    <div className={styles.formGrid}>
                      <label className={styles.formField}>
                        <span className={styles.formLabel}>
                          Nombre del destinatario
                        </span>
                        <input
                          className={styles.input}
                          name="fullName"
                          value={addressForm.fullName}
                          onChange={handleAddressFieldChange}
                          placeholder="Ej. Alex Gamer"
                          required
                        />
                      </label>
                      <label className={styles.formField}>
                        <span className={styles.formLabel}>Dirección</span>
                        <input
                          className={styles.input}
                          name="line1"
                          value={addressForm.line1}
                          onChange={handleAddressFieldChange}
                          placeholder="Ej. Av. Gamer 1337"
                          required
                        />
                      </label>
                      <label className={styles.formField}>
                        <span className={styles.formLabel}>Región</span>
                        <select
                          className={styles.select}
                          name="region"
                          value={addressForm.region}
                          onChange={handleAddressFieldChange}
                        >
                          <option value="">Selecciona una región</option>
                          {regiones.map((region) => (
                            <option key={region.nombre} value={region.nombre}>
                              {region.nombre}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={styles.formField}>
                        <span className={styles.formLabel}>
                          Ciudad / comuna
                        </span>
                        <select
                          className={styles.select}
                          name="city"
                          value={addressForm.city}
                          onChange={handleAddressFieldChange}
                          disabled={!addressForm.region}
                        >
                          <option value="">
                            {addressForm.region
                              ? 'Selecciona una comuna'
                              : 'Primero elige una región'}
                          </option>
                          {addressComunaOptions.map((comuna) => (
                            <option key={comuna} value={comuna}>
                              {comuna}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={styles.formField}>
                        <span className={styles.formLabel}>País</span>
                        <input
                          className={styles.input}
                          name="country"
                          value={addressForm.country}
                          onChange={handleAddressFieldChange}
                          placeholder="País"
                        />
                      </label>
                      <label
                        className={`${styles.formField} ${styles.checkboxField}`}
                      >
                        <input
                          type="checkbox"
                          name="isPrimary"
                          checked={addressForm.isPrimary}
                          onChange={handleAddressFieldChange}
                        />
                        <span>Marcar como dirección principal</span>
                      </label>
                    </div>
                    <div className={styles.formActions}>
                      <button
                        type="submit"
                        className={styles.primaryButton}
                        disabled={isSavingAddress}
                      >
                        {isSavingAddress ? 'Guardando...' : addressSubmitLabel}
                      </button>
                      {addressMode === 'edit' && (
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={handleCancelAddressEdit}
                          disabled={isSavingAddress}
                        >
                          Cancelar edición
                        </button>
                      )}
                    </div>
                  </form>

                  <div className={styles.addressListSection}>
                    <h3 className={styles.formSectionTitle}>
                      Direcciones guardadas
                    </h3>
                    {addresses.length === 0 ? (
                      <p className={styles.referralEmpty}>
                        Aún no agregas direcciones. Guarda al menos una para
                        acelerar tus envíos.
                      </p>
                    ) : (
                      <ul className={styles.addressList}>
                        {addresses.map((address) => (
                          <li
                            key={address.id}
                            className={styles.addressListItem}
                          >
                            <div className={styles.addressDetails}>
                              <strong>{address.fullName}</strong>
                              <span>{address.line1}</span>
                              <span>
                                {[address.city, address.region]
                                  .filter(Boolean)
                                  .join(', ')}
                              </span>
                              <span>{address.country}</span>
                            </div>
                            <div className={styles.addressActions}>
                              {address.isPrimary ? (
                                <span className={styles.addressBadge}>
                                  Principal
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className={styles.ghostButton}
                                  onClick={() =>
                                    handleSetPrimaryAddressClick(address.id)
                                  }
                                  disabled={isSavingAddress}
                                >
                                  Marcar principal
                                </button>
                              )}
                              <button
                                type="button"
                                className={styles.ghostButton}
                                onClick={() => handleEditAddress(address)}
                                disabled={isSavingAddress}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className={styles.dangerButton}
                                onClick={() => handleDeleteAddress(address.id)}
                                disabled={isSavingAddress}
                              >
                                Eliminar
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div
                  id="tab-panel-preferences"
                  role="tabpanel"
                  aria-labelledby="tab-trigger-preferences"
                  className={styles.tabPanel}
                >
                  <h2 className={styles.tabTitle}>Preferencias</h2>
                  <p className={styles.tabDescription}>
                    Define tus preferencias para agilizar el proceso de compra.
                  </p>

                  <div className={styles.preferenceSection}>
                    <label
                      className={styles.formLabel}
                      htmlFor="default-payment-select"
                    >
                      Método de pago preferido
                    </label>
                    <select
                      id="default-payment-select"
                      className={styles.select}
                      value={paymentPreference}
                      onChange={handlePaymentPreferenceChange}
                      disabled={isSavingPayment}
                    >
                      <option value="">Sin preferencia</option>
                      {PAYMENT_METHOD_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className={styles.helperText}>
                      {paymentPreference
                        ? isSavingPayment
                          ? 'Guardando preferencia…'
                          : paymentHelper
                        : 'Puedes definir un método favorito y cambiarlo en cada compra.'}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'referrals' && (
                <ReferralTabContent
                  panelId="tab-panel-referrals"
                  labelId="tab-trigger-referrals"
                  referralCode={referralCode}
                  referralLink={referralLink}
                  referralCount={referralCount}
                  referrals={referrals}
                  referralFeedback={referralFeedback}
                  onCopy={handleCopyCode}
                  onShare={handleShareReferral}
                  maskEmailFn={maskEmail}
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
