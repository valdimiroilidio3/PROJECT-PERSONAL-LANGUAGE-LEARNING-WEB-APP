// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState, ProgressBar } from '../components/ui';
import { FadeUp, Stagger, StaggerItem } from '../components/effects';

describe('vida visual', () => {
  it('EmptyState mostra a ilustração original quando fornecida', () => {
    render(
      <EmptyState
        title="Vazio"
        description="Sem dados."
        illustration={{ src: '/images/nori-review.jpg', alt: 'Nori com cartões de vocabulário' }}
      />,
    );
    const image = screen.getByAltText('Nori com cartões de vocabulário');
    expect(image.getAttribute('src')).toContain('nori-review.jpg');
  });

  it('EmptyState funciona sem ilustração (sem regressões)', () => {
    render(<EmptyState title="Nada aqui" description="Sem dados." />);
    expect(screen.getByText('Nada aqui')).toBeTruthy();
  });

  it('Stagger + StaggerItem e FadeUp renderizam o conteúdo', () => {
    render(
      <Stagger>
        <StaggerItem>
          <p>Cartão em cascata</p>
        </StaggerItem>
      </Stagger>,
    );
    expect(screen.getByText('Cartão em cascata')).toBeTruthy();
    render(
      <FadeUp>
        <p>Secção</p>
      </FadeUp>,
    );
    expect(screen.getByText('Secção')).toBeTruthy();
  });

  it('ProgressBar expõe o papel de progressbar com os valores reais', () => {
    render(<ProgressBar value={3} max={10} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('3');
    expect(bar.getAttribute('aria-valuemax')).toBe('10');
  });
});
