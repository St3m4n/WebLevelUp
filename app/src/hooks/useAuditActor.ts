import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { AuditActor } from '@/types';
import { createAuditActorFromUser } from '@/utils/audit';

export const useAuditActor = (): Partial<AuditActor> | undefined => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) {
      return undefined;
    }

    return createAuditActorFromUser({
      run: user.run,
      nombre: user.nombre,
      apellidos: user.apellidos,
      correo: user.correo,
      perfil: user.perfil,
    });
  }, [user]);
};
