import type { LevelUpReferralDto } from '@/utils/levelup';

export type UsuarioPerfil = 'Administrador' | 'Vendedor' | 'Cliente';

export interface Producto {
  codigo: string;
  nombre: string;
  categoria: string;
  fabricante: string;
  distribuidor: string;
  precio: number;
  stock: number;
  stockCritico: number;
  url: string;
  descripcion: string;
}

export interface Usuario {
  run: string;
  nombre: string;
  apellidos: string;
  correo: string;
  perfil: UsuarioPerfil;
  fechaNacimiento: string | null;
  region: string;
  comuna: string;
  direccion: string;
  descuentoVitalicio: boolean;
  isSystem?: boolean;
  passwordHash?: string;
  passwordSalt?: string;
  nivel?: number;
  activo?: boolean;
  fechaRegistro?: string;
  roles?: string[];
  puntosLevelUp?: number;
  referidos?: {
    count: number;
    users: LevelUpReferralDto[];
  };
}

export interface Comuna {
  nombre: string;
}

export interface Region {
  nombre: string;
  comunas: Comuna[];
}

export interface Categoria {
  name: string;
  deletedAt?: string | null;
}

export type OrderStatus = 'Pagado' | 'Pendiente' | 'Cancelado';

export type PaymentPreferenceMethod = 'tarjeta' | 'transferencia' | 'efectivo';

export interface UserPreferences {
  defaultPaymentMethod?: PaymentPreferenceMethod;
}

export interface UserAddress {
  id: string;
  fullName: string;
  line1: string;
  city: string;
  region: string;
  country: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ProfileOverrides {
  nombre?: string;
  apellidos?: string;
  region?: string;
  comuna?: string;
  direccion?: string;
  preferencias?: UserPreferences;
  updatedAt?: string;
}

export interface OrderItem {
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userEmail: string;
  userName: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
  paymentMethod: PaymentPreferenceMethod;
  direccion: string;
  region: string;
  comuna: string;
  status: OrderStatus;
}

export type ContactMessageStatus = 'pendiente' | 'respondido';

export interface ContactMessage {
  id: string;
  nombre: string;
  email: string;
  asunto: string;
  mensaje: string;
  status: ContactMessageStatus;
  respuesta?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityNewsItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string[];
  publishedAt: string;
  image: string;
  accent?: 'neon' | 'default';
  highlight?: boolean;
}

export interface CommunityBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  publishedAt: string;
  image: string;
}

export type CommunityGuideIcon =
  | 'controller'
  | 'motherboard'
  | 'tools'
  | 'camera';

export interface CommunityGuide {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: CommunityGuideIcon;
  content: string[];
  updatedAt?: string;
  readTime?: string;
}

export interface CommunityEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  location: string;
  startTime: string;
  content: string[];
}

export type AuditAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'restored'
  | 'login'
  | 'logout'
  | 'registered'
  | 'status-changed'
  | 'responded';

export type AuditEntityType =
  | 'producto'
  | 'usuario'
  | 'orden'
  | 'mensaje'
  | 'categoria'
  | 'auth'
  | 'sistema';

export type AuditSeverity = 'low' | 'medium' | 'high';

export type AuditActor = {
  id: string;
  name: string;
  email?: string;
  role?: string;
};

export type AuditEntityRef = {
  type: AuditEntityType;
  id?: string;
  name?: string;
  context?: string;
};

export type AuditEvent<TMetadata = unknown> = {
  id: string;
  timestamp: string;
  action: AuditAction;
  actor: AuditActor;
  entity: AuditEntityRef;
  summary: string;
  metadata?: TMetadata;
  severity?: AuditSeverity;
};
