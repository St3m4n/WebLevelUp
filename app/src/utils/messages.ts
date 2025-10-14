import type { ContactMessage, ContactMessageStatus } from '@/types';

const MESSAGE_STORAGE_KEY = 'contacto:mensajes';
const MESSAGE_UPDATED_EVENT = 'levelup-messages-updated';

const isBrowser = typeof window !== 'undefined';

const safeParse = (raw: string | null): unknown => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('No se pudieron parsear los mensajes guardados', error);
    return null;
  }
};

const sanitizeMessage = (candidate: unknown): ContactMessage | null => {
  if (!candidate || typeof candidate !== 'object') return null;
  const partial = candidate as Partial<ContactMessage>;
  if (
    typeof partial.id !== 'string' ||
    typeof partial.nombre !== 'string' ||
    typeof partial.email !== 'string' ||
    typeof partial.asunto !== 'string' ||
    typeof partial.mensaje !== 'string' ||
    typeof partial.status !== 'string' ||
    typeof partial.createdAt !== 'string'
  ) {
    return null;
  }

  const status: ContactMessageStatus =
    partial.status === 'respondido' ? 'respondido' : 'pendiente';

  return {
    id: partial.id,
    nombre: partial.nombre,
    email: partial.email,
    asunto: partial.asunto,
    mensaje: partial.mensaje,
    status,
    respuesta: partial.respuesta ?? '',
    createdAt: partial.createdAt,
    updatedAt: partial.updatedAt,
  };
};

const sortMessages = (messages: ContactMessage[]): ContactMessage[] => {
  return [...messages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const loadMessages = (): ContactMessage[] => {
  if (!isBrowser) return [];
  const parsed = safeParse(window.localStorage.getItem(MESSAGE_STORAGE_KEY));
  if (!Array.isArray(parsed)) return [];
  const sanitized = (parsed as unknown[])
    .map((item) => sanitizeMessage(item))
    .filter((item): item is ContactMessage => Boolean(item));
  return sortMessages(sanitized);
};

const persistMessages = (messages: ContactMessage[]) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(
      MESSAGE_STORAGE_KEY,
      JSON.stringify(messages)
    );
    window.dispatchEvent(new Event(MESSAGE_UPDATED_EVENT));
  } catch (error) {
    console.warn('No se pudieron guardar los mensajes de contacto', error);
  }
};

export const addMessage = (payload: Omit<ContactMessage, 'id' | 'status'>) => {
  const current = loadMessages();
  const message: ContactMessage = {
    ...payload,
    id: `MSG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'pendiente',
  };
  const next = sortMessages([message, ...current]);
  persistMessages(next);
  return message;
};

export const updateMessage = (
  id: string,
  updater: (message: ContactMessage) => ContactMessage
): ContactMessage | null => {
  const current = loadMessages();
  const index = current.findIndex((message) => message.id === id);
  if (index === -1) return null;
  const updated = updater(current[index]);
  const next = [...current];
  next[index] = {
    ...updated,
    updatedAt: new Date().toISOString(),
  };
  persistMessages(sortMessages(next));
  return next[index];
};

export const updateMessageStatus = (
  id: string,
  status: ContactMessageStatus
): ContactMessage | null => {
  return updateMessage(id, (message) => ({ ...message, status }));
};

export const subscribeToMessages = (listener: () => void) => {
  if (!isBrowser) return () => undefined;
  const handler = () => listener();
  window.addEventListener(MESSAGE_UPDATED_EVENT, handler);
  return () => window.removeEventListener(MESSAGE_UPDATED_EVENT, handler);
};

export const MESSAGE_STORAGE_KEYS = {
  key: MESSAGE_STORAGE_KEY,
  event: MESSAGE_UPDATED_EVENT,
};
