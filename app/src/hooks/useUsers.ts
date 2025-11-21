import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { fetchUsers } from '@/services/userService';
import type { Usuario } from '@/types';

export const useUsers = () => {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await fetchUsers();
      setUsers(payload);
    } catch (error) {
      console.warn('No se pudieron cargar los usuarios', error);
      addToast({
        variant: 'error',
        title: 'No se pudieron cargar los usuarios',
        description:
          'No se pudo obtener la lista de usuarios desde el servidor.',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    users,
    isLoading: loading,
    reload,
  };
};
