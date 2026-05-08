import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { InvestForm } from './InvestForm';

export default async function InvestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { issuer: true }
  });

  if (!offer) {
    notFound();
  }

  return (
    <div className="invest-page container section-padding">
      <div className="card p-6" style={{maxWidth: '600px', margin: '0 auto'}}>
        <h1 className="text-h2 mb-4">Investir em {offer.issuer.trade_name}</h1>
        <p className="text-body text-muted mb-6">
          Preencha o valor que deseja investir. A transação será registrada na blockchain Stellar.
        </p>
        
        <div className="card p-6 mb-6" style={{backgroundColor: 'var(--kate-light-gray)', color: 'var(--kate-dark-blue)'}}>
          <div className="stat mb-4">
            <span className="stat-label">Investimento Mínimo:</span>
            <span className="stat-value">R$ {(offer.min_investment || 0).toLocaleString('pt-BR')}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Preço por Token:</span>
            <span className="stat-value">R$ {(offer.unit_price || 0).toLocaleString('pt-BR')}</span>
          </div>
        </div>

        <InvestForm offer={offer} />
      </div>
    </div>
  );
}
