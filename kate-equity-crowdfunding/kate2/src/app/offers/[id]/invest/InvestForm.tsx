'use client';

import { useState } from 'react';
import { processInvestment } from '@/app/actions/invest';

export function InvestForm({ offer }: { offer: any }) {
  const [amount, setAmount] = useState<number>(offer.min_investment || 0);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount < (offer.min_investment || 0)) {
      setError(`O valor mínimo é R$ ${(offer.min_investment || 0).toLocaleString('pt-BR')}`);
      return;
    }

    setIsPending(true);
    try {
      await processInvestment(offer.id, amount);
      // redirect is handled in the server action
    } catch (err: any) {
      setError(err.message || 'Erro ao processar investimento');
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
      {error && (
        <div style={{backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '4px', fontSize: '0.875rem'}}>
          {error}
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="amount" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem'}}>Valor do Investimento (R$)</label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          min={offer.min_investment || 0}
          step={offer.unit_price || 1}
          style={{width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', fontSize: '1rem', outline: 'none'}}
          disabled={isPending}
        />
      </div>

      <div style={{fontSize: '0.875rem', color: 'var(--kate-dark-gray)', marginBottom: '1rem'}}>
        Você receberá aproximadamente <strong>{Math.floor(amount / (offer.unit_price || 1))}</strong> tokens.
      </div>

      <button 
        type="submit" 
        className="btn-primary w-full"
        style={{padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center'}}
        disabled={isPending}
      >
        {isPending ? (
          <>
            <span style={{marginRight: '0.75rem'}}>⏳</span>
            Processando na Stellar...
          </>
        ) : (
          'Confirmar Investimento'
        )}
      </button>
    </form>
  );
}
