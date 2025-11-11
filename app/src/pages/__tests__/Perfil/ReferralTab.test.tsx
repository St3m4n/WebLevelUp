import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReferralTabContent } from '../../Perfil';

vi.mock('../../Perfil.module.css', () => ({
  default: {
    tabPanel: 'tabPanel',
    tabTitle: 'tabTitle',
    tabDescription: 'tabDescription',
    referralSection: 'referralSection',
    referralHeader: 'referralHeader',
    subsectionTitle: 'subsectionTitle',
    referralCounter: 'referralCounter',
    referralInputGroup: 'referralInputGroup',
    referralInput: 'referralInput',
    referralButton: 'referralButton',
    referralFeedback: 'referralFeedback',
    referralHint: 'referralHint',
    referralListSection: 'referralListSection',
    referralEmpty: 'referralEmpty',
    referralList: 'referralList',
    referralListItem: 'referralListItem',
    referralEmail: 'referralEmail',
    referralDate: 'referralDate',
  },
}));

describe('ReferralTabContent', () => {
  it('calls copy and share handlers when buttons are pressed', async () => {
    const onCopy = vi.fn();
    const onShare = vi.fn();
    const user = userEvent.setup();

    // Renderiza el componente con un código y link válidos para probar las acciones.
    render(
      <ReferralTabContent
        panelId="test-panel"
        labelId="test-label"
        referralCode="ABC-123"
        referralLink="https://levelup.test/ref/ABC-123"
        referralCount={2}
        referrals={[]}
        referralFeedback={null}
        onCopy={onCopy}
        onShare={onShare}
      />
    );

    // Simula que la persona usuaria presiona las acciones de copiar y compartir.
    await user.click(screen.getByRole('button', { name: 'Copiar código' }));
    await user.click(screen.getByRole('button', { name: 'Compartir enlace' }));

    // Verifica que los manejadores se llamen una sola vez cada uno.
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it('renders feedback and masked referrals', () => {
    const referrals = [
      { email: 'user1@example.com', dateLabel: '10 de agosto' },
      { email: 'user2@example.com', dateLabel: '' },
    ];
    const maskSpy = vi.fn((email: string) => `***${email}`);

    // Renderiza el componente con feedback y una función personalizada para enmascarar correos.
    render(
      <ReferralTabContent
        panelId="test-panel"
        labelId="test-label"
        referralCode="ABC-123"
        referralLink="https://levelup.test/ref/ABC-123"
        referralCount={referrals.length}
        referrals={referrals}
        referralFeedback="Código copiado"
        onCopy={vi.fn()}
        onShare={vi.fn()}
        maskEmailFn={maskSpy}
      />
    );

    // Comprueba que se muestre el mensaje de feedback y los correos enmascarados.
    expect(screen.getByText('Código copiado')).toBeInTheDocument();
    expect(screen.getByText('***user1@example.com')).toBeInTheDocument();
    expect(screen.getByText('Reciente')).toBeInTheDocument();
    // Confirma que el callback de enmascarado se utilice con cada correo recibido.
    expect(maskSpy).toHaveBeenCalledWith('user2@example.com');
  });
});
