// @ts-nocheck
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ToastViewport from '../ToastViewport';

describe('ToastViewport', () => {
  const sampleToasts = [
    {
      id: 'toast-1',
      title: 'Perfil actualizado',
      description: 'Guardamos tus cambios.',
      variant: 'success',
    },
    {
      id: 'toast-2',
      title: 'Error',
      description: 'No pudimos guardar.',
      variant: 'error',
    },
  ];

  it('renderiza toasts y permite cerrarlos manualmente', () => {
    const handleDismiss = vi.fn();

    // Renderiza el viewport con dos toasts para validar la interacción de cierre manual.
    render(<ToastViewport toasts={sampleToasts} onDismiss={handleDismiss} />);

    // Comprueba que ambas notificaciones se muestran en pantalla.
    expect(screen.getByText('Perfil actualizado')).toBeInTheDocument();
    expect(screen.getByText('No pudimos guardar.')).toBeInTheDocument();

    // Simula que la persona usuaria cierra el primer toast.
    fireEvent.click(screen.getAllByRole('button', { name: /cerrar/i })[0]);

    // Verifica que el callback reciba el identificador correcto.
    expect(handleDismiss).toHaveBeenCalledWith('toast-1');
  });

  it('no renderiza nada cuando no hay toasts', () => {
    // Si la lista está vacía, el contenedor debe quedar sin contenido.
    const { container } = render(<ToastViewport toasts={[]} onDismiss={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
