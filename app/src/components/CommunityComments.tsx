import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
} from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import styles from './CommunityComments.module.css';

type CommunityComment = {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
  replies: CommunityComment[];
  edited?: boolean;
  editedAt?: string;
  deleted?: boolean;
};

type CommunityCommentsProps = {
  postKey: string;
  seedDemo?: boolean;
};

const STORAGE_PREFIX = 'comments:blog:';
const REPLY_SLICE = 5;
const BORRADO_USER = '[borrado por el usuario]';
const BORRADO_ADMIN = '[borrado por un administrador]';

const LEGACY_STORAGE_KEYS: Record<string, string[]> = {
  'top-teclados-2025': ['blog_1'],
};

const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;

const normalizeNode = (node: CommunityComment): CommunityComment => ({
  id: node.id ?? createId(),
  name: node.name ?? 'Jugador',
  email: node.email ?? '',
  message: node.message ?? '',
  date: node.date ?? new Date().toISOString(),
  replies: Array.isArray(node.replies)
    ? node.replies.map((child) => normalizeNode(child))
    : [],
  edited: Boolean(node.edited),
  editedAt: node.editedAt,
  deleted: Boolean(node.deleted),
});

const normalizeTree = (list: CommunityComment[]): CommunityComment[] =>
  list.map((node) => normalizeNode(node));

const seedSample = (runSeed: boolean): CommunityComment[] => {
  if (!runSeed) return [];
  const now = Date.now();
  return [
    {
      id: createId(),
      name: 'María López',
      email: 'maria@example.com',
      message: 'Excelente resumen, me ayudó a decidir mi próximo teclado.',
      date: new Date(now).toISOString(),
      replies: [],
    },
    {
      id: createId(),
      name: 'Juan Pérez',
      email: 'juan@example.com',
      message: '¿Alguno con switches silenciosos que recomienden?',
      date: new Date(now - 5 * 60 * 1000).toISOString(),
      replies: [],
    },
  ];
};

const countDescendants = (node: CommunityComment): number =>
  node.replies.reduce((total, child) => total + 1 + countDescendants(child), 0);

const ensureTargets = (
  primary: string,
  extras: Array<string | null | undefined>
): string[] => {
  const unique = new Set<string>([primary]);
  extras.forEach((extra) => {
    if (extra && extra !== primary) {
      unique.add(extra);
    }
  });
  return Array.from(unique);
};

const shallowEqualMap = (
  a: Record<string, boolean>,
  b: Record<string, boolean>
): boolean => {
  if (a === b) return true;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
};

const CommunityComments: React.FC<CommunityCommentsProps> = ({
  postKey,
  seedDemo = false,
}) => {
  const storageKey = `${STORAGE_PREFIX}${postKey}`;
  const candidateKeys = useMemo(() => {
    const extras = new Set<string>();
    if (!postKey.startsWith('blog-')) {
      extras.add(`${STORAGE_PREFIX}blog-${postKey}`);
    } else {
      const trimmed = postKey.replace(/^blog-/, '');
      if (trimmed) {
        extras.add(`${STORAGE_PREFIX}${trimmed}`);
      }
    }
    const legacyMatches = LEGACY_STORAGE_KEYS[postKey];
    if (legacyMatches) {
      legacyMatches.forEach((legacy) => {
        extras.add(`${STORAGE_PREFIX}${legacy}`);
        extras.add(`${STORAGE_PREFIX}blog-${legacy}`);
      });
    }
    extras.delete(storageKey);
    return [storageKey, ...extras];
  }, [postKey, storageKey]);

  const collapseCandidates = useMemo(
    () => candidateKeys.map((key) => `${key}:collapsed`),
    [candidateKeys]
  );
  const sliceCandidates = useMemo(
    () => candidateKeys.map((key) => `${key}:slice-expanded`),
    [candidateKeys]
  );

  const { user } = useAuth();
  const { addToast } = useToast();

  const loadedRef = useRef(false);
  const commentTargetsRef = useRef<string[]>([storageKey]);
  const collapseTargetsRef = useRef<string[]>([`${storageKey}:collapsed`]);
  const sliceTargetsRef = useRef<string[]>([`${storageKey}:slice-expanded`]);

  const persistComments = useCallback(
    (next: CommunityComment[]) => {
      if (typeof window === 'undefined') return;
      try {
        const targets = ensureTargets(storageKey, commentTargetsRef.current);
        const payload = JSON.stringify(next);
        targets.forEach((key) => {
          window.localStorage.setItem(key, payload);
        });
      } catch (error) {
        console.warn('No se pudieron guardar comentarios', error);
      }
    },
    [storageKey]
  );

  const persistCollapsed = useCallback(
    (next: Record<string, boolean>) => {
      if (typeof window === 'undefined') return;
      try {
        const targets = ensureTargets(
          `${storageKey}:collapsed`,
          collapseTargetsRef.current
        );
        const payload = JSON.stringify(next);
        targets.forEach((key) => {
          window.localStorage.setItem(key, payload);
        });
      } catch (error) {
        console.warn('No se pudieron guardar estados de colapso', error);
      }
    },
    [storageKey]
  );

  const persistSlices = useCallback(
    (next: Record<string, boolean>) => {
      if (typeof window === 'undefined') return;
      try {
        const targets = ensureTargets(
          `${storageKey}:slice-expanded`,
          sliceTargetsRef.current
        );
        const payload = JSON.stringify(next);
        targets.forEach((key) => {
          window.localStorage.setItem(key, payload);
        });
      } catch (error) {
        console.warn('No se pudieron guardar estados de respuesta', error);
      }
    },
    [storageKey]
  );

  const updateComments = useCallback(
    (producer: (previous: CommunityComment[]) => CommunityComment[]) => {
      setComments((previous) => {
        const next = producer(previous);
        if (next === previous) {
          return previous;
        }
        if (loadedRef.current) {
          persistComments(next);
        }
        return next;
      });
    },
    [persistComments]
  );

  const updateCollapsedState = useCallback(
    (
      producer: (previous: Record<string, boolean>) => Record<string, boolean>
    ) => {
      setCollapsed((previous) => {
        const next = producer(previous);
        if (next === previous || shallowEqualMap(previous, next)) {
          return previous;
        }
        if (loadedRef.current) {
          persistCollapsed(next);
        }
        return next;
      });
    },
    [persistCollapsed]
  );

  const updateExpandedSlices = useCallback(
    (
      producer: (previous: Record<string, boolean>) => Record<string, boolean>
    ) => {
      setExpandedSlices((previous) => {
        const next = producer(previous);
        if (next === previous || shallowEqualMap(previous, next)) {
          return previous;
        }
        if (loadedRef.current) {
          persistSlices(next);
        }
        return next;
      });
    },
    [persistSlices]
  );

  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [expandedSlices, setExpandedSlices] = useState<Record<string, boolean>>(
    {}
  );
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');
  const [activeReply, setActiveReply] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const [activeEdit, setActiveEdit] = useState<{
    id: string;
    text: string;
  } | null>(null);

  const isAuthenticated = Boolean(user);
  const canModerate = (comment: CommunityComment) =>
    Boolean(user?.perfil === 'Administrador' || comment.email === user?.correo);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    loadedRef.current = false;
    commentTargetsRef.current = [storageKey];
    collapseTargetsRef.current = [`${storageKey}:collapsed`];
    sliceTargetsRef.current = [`${storageKey}:slice-expanded`];
    try {
      let resolvedStorage = storageKey;
      let persisted: CommunityComment[] = [];
      let foundKey: string | null = null;

      for (const key of candidateKeys) {
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        try {
          const next = JSON.parse(raw) as CommunityComment[];
          if (!Array.isArray(next)) continue;
          if (foundKey === null) {
            foundKey = key;
            resolvedStorage = key;
            persisted = next;
          }
          if (next.length > 0) {
            resolvedStorage = key;
            persisted = next;
            break;
          }
        } catch (parseError) {
          console.warn('No se pudieron parsear comentarios almacenados', {
            key,
            parseError,
          });
        }
      }

      const normalized = normalizeTree(
        Array.isArray(persisted) ? persisted : []
      );
      const initial =
        normalized.length > 0 ? normalized : seedSample(!foundKey && seedDemo);
      setComments(initial);

      const orderUnique = (sources: string[]): string[] => {
        const seen = new Set<string>();
        const ordered: string[] = [];
        sources.forEach((source) => {
          if (!seen.has(source)) {
            seen.add(source);
            ordered.push(source);
          }
        });
        return ordered;
      };

      const pickMap = (sources: string[]) => {
        for (const key of sources) {
          const raw = window.localStorage.getItem(key);
          if (!raw) continue;
          try {
            const parsedMap = JSON.parse(raw) as Record<string, boolean>;
            if (parsedMap && typeof parsedMap === 'object') {
              return { map: parsedMap, key };
            }
          } catch (mapError) {
            console.warn('No se pudieron parsear estados almacenados', {
              key,
              mapError,
            });
          }
        }
        return { map: {}, key: null };
      };

      const collapseSources = orderUnique([
        `${resolvedStorage}:collapsed`,
        `${storageKey}:collapsed`,
        ...collapseCandidates,
      ]);
      const sliceSources = orderUnique([
        `${resolvedStorage}:slice-expanded`,
        `${storageKey}:slice-expanded`,
        ...sliceCandidates,
      ]);

      const { map: initialCollapsed, key: collapsedSource } =
        pickMap(collapseSources);
      setCollapsed(initialCollapsed);

      const { map: initialSlices, key: slicesSource } = pickMap(sliceSources);
      setExpandedSlices(initialSlices);

      commentTargetsRef.current = ensureTargets(storageKey, [resolvedStorage]);
      collapseTargetsRef.current = ensureTargets(`${storageKey}:collapsed`, [
        collapsedSource,
      ]);
      sliceTargetsRef.current = ensureTargets(`${storageKey}:slice-expanded`, [
        slicesSource,
      ]);

      loadedRef.current = true;

      persistComments(initial);
      persistCollapsed(initialCollapsed);
      persistSlices(initialSlices);
    } catch (error) {
      console.warn('No se pudieron cargar comentarios', error);
      loadedRef.current = true;
    }
  }, [
    candidateKeys,
    collapseCandidates,
    sliceCandidates,
    seedDemo,
    storageKey,
    persistComments,
    persistCollapsed,
    persistSlices,
  ]);

  const topLevelCount = comments.length;
  const totalCount = useMemo(
    () =>
      comments.reduce((sum, comment) => sum + 1 + countDescendants(comment), 0),
    [comments]
  );

  const handleAddComment = () => {
    if (!isAuthenticated || message.trim().length === 0) return;
    const nuevaEntrada: CommunityComment = {
      id: createId(),
      name: user?.nombre || user?.correo?.split('@')[0] || 'Jugador',
      email: user?.correo || '',
      message: message.trim(),
      date: new Date().toISOString(),
      replies: [],
    };
    updateComments((prev) => [nuevaEntrada, ...prev]);
    setMessage('');
    addToast({
      title: 'Comentario publicado',
      description: 'Tu comentario se agregó a la conversación.',
      variant: 'success',
      duration: 4000,
    });
  };

  const toggleCollapse = (id: string) => {
    updateCollapsedState((previous) => {
      if (previous[id]) {
        const next = { ...previous };
        delete next[id];
        return next;
      }

      updateExpandedSlices((prevSlices) => {
        if (!prevSlices[id]) return prevSlices;
        const copy = { ...prevSlices };
        delete copy[id];
        return copy;
      });

      return { ...previous, [id]: true };
    });
  };

  const collapseAll = () => {
    const walk = (nodes: CommunityComment[], acc: Record<string, boolean>) => {
      nodes.forEach((node) => {
        acc[node.id] = true;
        if (node.replies.length) walk(node.replies, acc);
      });
    };
    updateCollapsedState((previous) => {
      const next: Record<string, boolean> = {};
      walk(comments, next);
      return shallowEqualMap(previous, next) ? previous : next;
    });
  };

  const expandAll = () =>
    updateCollapsedState((previous) =>
      Object.keys(previous).length === 0 ? previous : {}
    );

  const addReply = (id: string, text: string) => {
    const reply: CommunityComment = {
      id: createId(),
      name: user?.nombre || user?.correo?.split('@')[0] || 'Jugador',
      email: user?.correo || '',
      message: text.trim(),
      date: new Date().toISOString(),
      replies: [],
    };
    const mutate = (nodes: CommunityComment[]): CommunityComment[] => {
      let updated = false;
      const next = nodes.map((node) => {
        if (node.id === id) {
          updated = true;
          return { ...node, replies: [reply, ...node.replies] };
        }
        const nested = mutate(node.replies);
        if (nested !== node.replies) {
          updated = true;
          return { ...node, replies: nested };
        }
        return node;
      });
      return updated ? next : nodes;
    };
    updateComments(mutate);
  };

  const updateMessageById = (id: string, nextMessage: string) => {
    const mutate = (nodes: CommunityComment[]): CommunityComment[] => {
      let updated = false;
      const next = nodes
        .map((node) => {
          if (node.id === id) {
            updated = true;
            return {
              ...node,
              message: nextMessage,
              edited: true,
              editedAt: new Date().toISOString(),
            };
          }
          const nested = mutate(node.replies);
          if (nested !== node.replies) {
            updated = true;
            return { ...node, replies: nested };
          }
          return node;
        })
        .filter(
          Boolean as unknown as (
            value: CommunityComment | null
          ) => value is CommunityComment
        );
      return updated ? next : nodes;
    };
    updateComments(mutate);
  };

  const removeOrSoftDelete = (id: string, hardDelete: boolean) => {
    const mutate = (nodes: CommunityComment[]): CommunityComment[] => {
      let changed = false;
      const result: CommunityComment[] = [];
      nodes.forEach((node) => {
        if (node.id === id) {
          changed = true;
          if (hardDelete || node.replies.length === 0) {
            return;
          }
          const placeholder =
            user?.perfil === 'Administrador' ? BORRADO_ADMIN : BORRADO_USER;
          result.push({
            ...node,
            message: placeholder,
            deleted: true,
          });
          return;
        }
        const nested = mutate(node.replies);
        if (nested !== node.replies) {
          changed = true;
          result.push({ ...node, replies: nested });
        } else {
          result.push(node);
        }
      });
      return changed ? result : nodes;
    };
    updateComments(mutate);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) {
      addToast({
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para comentar.',
        variant: 'warning',
      });
      return;
    }
    if (message.trim().length === 0) {
      addToast({
        title: 'Comentario vacío',
        description: 'Escribe tu comentario antes de enviar.',
        variant: 'warning',
      });
      return;
    }
    setStatus('submitting');
    handleAddComment();
    setStatus('idle');
  };

  const renderReplies = (
    parent: CommunityComment,
    depth: number
  ): ReactElement | null => {
    const replies = parent.replies;
    if (!replies.length) return null;
    const isExpanded = expandedSlices[parent.id];
    const visible = isExpanded ? replies : replies.slice(0, REPLY_SLICE);
    const hasHidden = replies.length > visible.length;
    return (
      <div className={styles.replyGroup}>
        {visible.map((reply) => renderComment(reply, depth + 1))}
        {hasHidden && (
          <button
            type="button"
            className={styles.linkButton}
            onClick={() =>
              updateExpandedSlices((previous) => {
                if (previous[parent.id]) return previous;
                return { ...previous, [parent.id]: true };
              })
            }
          >
            Mostrar {replies.length - visible.length}{' '}
            {replies.length - visible.length === 1
              ? 'respuesta más'
              : 'respuestas más'}
          </button>
        )}
      </div>
    );
  };

  const renderComment = (
    comment: CommunityComment,
    depth: number
  ): ReactElement => {
    const collapsedNode = collapsed[comment.id];
    const canEdit =
      canModerate(comment) &&
      (!comment.deleted || user?.perfil === 'Administrador');
    const descendantCount = collapsedNode ? countDescendants(comment) : 0;
    const isReplyActive = activeReply?.id === comment.id;
    const isEditActive = activeEdit?.id === comment.id;
    return (
      <div key={comment.id} className={styles.commentCard} data-depth={depth}>
        <div className={styles.metaRow}>
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => toggleCollapse(comment.id)}
            aria-expanded={!collapsedNode}
          >
            {collapsedNode ? '▸' : '▾'}
          </button>
          <span className={styles.author}>{comment.name}</span>
          <span>{new Date(comment.date).toLocaleString('es-CL')}</span>
          {comment.edited && <span>· editado</span>}
        </div>

        {collapsedNode ? (
          <p className={styles.collapsedNotice}>
            Comentario contraído · {descendantCount}{' '}
            {descendantCount === 1 ? 'respuesta' : 'respuestas'}
          </p>
        ) : (
          <>
            <p
              className={
                comment.deleted ? styles.deletedMessage : styles.message
              }
            >
              {comment.message}
            </p>
            {!comment.deleted && (
              <div className={styles.commentActions}>
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => {
                    if (!isAuthenticated) {
                      addToast({
                        title: 'Inicia sesión',
                        description: 'Debes iniciar sesión para responder.',
                        variant: 'warning',
                      });
                      return;
                    }
                    setActiveEdit(null);
                    setActiveReply((current) =>
                      current?.id === comment.id
                        ? null
                        : { id: comment.id, text: '' }
                    );
                  }}
                >
                  <i className="bi bi-reply" aria-hidden="true" /> Responder
                </button>
                {canEdit && (
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => {
                      setActiveReply(null);
                      setActiveEdit((current) =>
                        current?.id === comment.id
                          ? null
                          : { id: comment.id, text: comment.message }
                      );
                    }}
                  >
                    <i className="bi bi-pencil-square" aria-hidden="true" />
                    Editar
                  </button>
                )}
                {canEdit && (
                  <button
                    type="button"
                    className={`${styles.linkButton} ${styles.linkButtonDanger}`}
                    onClick={() => {
                      const hardDelete = user?.perfil === 'Administrador';
                      removeOrSoftDelete(comment.id, hardDelete);
                      addToast({
                        title: 'Comentario eliminado',
                        description: hardDelete
                          ? 'Comentario eliminado permanentemente.'
                          : 'Comentario oculto, se mantendrá como marcador.',
                        variant: 'info',
                      });
                    }}
                  >
                    <i className="bi bi-trash3" aria-hidden="true" />
                    Eliminar
                  </button>
                )}
              </div>
            )}

            {isEditActive && (
              <div className={styles.inlineForm}>
                <textarea
                  className={styles.inlineTextarea}
                  value={activeEdit?.text ?? ''}
                  onChange={(event) =>
                    setActiveEdit((current) =>
                      current && current.id === comment.id
                        ? { id: current.id, text: event.target.value }
                        : current
                    )
                  }
                />
                <div className={styles.inlineActions}>
                  <button
                    type="button"
                    className={styles.submitButton}
                    onClick={() => {
                      if (!activeEdit?.text.trim()) {
                        addToast({
                          title: 'Mensaje vacío',
                          description: 'Escribe contenido antes de guardar.',
                          variant: 'warning',
                        });
                        return;
                      }
                      updateMessageById(comment.id, activeEdit.text.trim());
                      setActiveEdit(null);
                      addToast({
                        title: 'Comentario actualizado',
                        description: 'Los cambios fueron guardados.',
                        variant: 'success',
                      });
                    }}
                  >
                    Guardar cambios
                  </button>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => setActiveEdit(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {isReplyActive && (
              <div className={styles.inlineForm}>
                <textarea
                  className={styles.inlineTextarea}
                  value={activeReply?.text ?? ''}
                  onChange={(event) =>
                    setActiveReply((current) =>
                      current && current.id === comment.id
                        ? { id: current.id, text: event.target.value }
                        : current
                    )
                  }
                  placeholder="Escribe tu respuesta"
                />
                <div className={styles.inlineActions}>
                  <button
                    type="button"
                    className={styles.submitButton}
                    onClick={() => {
                      if (!isAuthenticated) {
                        addToast({
                          title: 'Inicia sesión',
                          description:
                            'Debes iniciar sesión para publicar una respuesta.',
                          variant: 'warning',
                        });
                        setActiveReply(null);
                        return;
                      }
                      if (!activeReply?.text.trim()) {
                        addToast({
                          title: 'Respuesta vacía',
                          description: 'Escribe tu respuesta antes de enviar.',
                          variant: 'warning',
                        });
                        return;
                      }
                      addReply(comment.id, activeReply.text.trim());
                      setActiveReply(null);
                      addToast({
                        title: 'Respuesta publicada',
                        description: 'Tu respuesta se agregó al hilo.',
                        variant: 'success',
                      });
                    }}
                  >
                    Publicar respuesta
                  </button>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => setActiveReply(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {renderReplies(comment, depth)}
          </>
        )}
      </div>
    );
  };

  const headerLabel = useMemo(() => {
    if (totalCount === 0) return 'Comentarios';
    if (totalCount === 1) return '1 comentario';
    return `${totalCount} comentarios`;
  }, [totalCount]);

  return (
    <section
      className={styles.commentsSection}
      aria-labelledby="community-comments"
    >
      <div className={styles.header}>
        <h2 id="community-comments" className={styles.title}>
          {headerLabel}
        </h2>
        {topLevelCount > 0 && (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.actionButton}
              onClick={expandAll}
            >
              Expandir todo
            </button>
            <button
              type="button"
              className={styles.actionButton}
              onClick={collapseAll}
            >
              Contraer todo
            </button>
          </div>
        )}
      </div>

      <form className={styles.formCard} onSubmit={handleSubmit}>
        <label htmlFor="comment-message" className={styles.formLabel}>
          Comparte tu opinión
        </label>
        <textarea
          id="comment-message"
          className={styles.textarea}
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
          }}
          disabled={!isAuthenticated || status === 'submitting'}
          placeholder={
            isAuthenticated
              ? 'Escribe tu comentario aquí…'
              : 'Debes iniciar sesión para participar'
          }
        />
        <button
          type="submit"
          className={styles.submitButton}
          disabled={!isAuthenticated || status === 'submitting'}
        >
          Publicar comentario
        </button>
        {!isAuthenticated && (
          <p className={styles.authNotice}>
            Debes iniciar sesión para comentar.{' '}
            <Link to="/login">Inicia sesión</Link>
          </p>
        )}
      </form>

      <div className={styles.threadList}>
        {comments.length === 0 ? (
          <p className={styles.emptyState}>
            No hay comentarios todavía. ¡Sé la primera persona en opinar!
          </p>
        ) : (
          comments.map((comment) => renderComment(comment, 0))
        )}
      </div>
    </section>
  );
};

export default CommunityComments;
