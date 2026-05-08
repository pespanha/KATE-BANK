import Link from 'next/link';
import prisma from '@/lib/prisma';

export default async function SuccessPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ tx?: string }> }) {
  const { id } = await params;
  const { tx } = await searchParams;
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { issuer: true }
  });

  return (
    <div className="container section-padding">
      <div className="card p-8" style={{maxWidth: '600px', margin: '0 auto', textAlign: 'center'}}>
        <div style={{fontSize: '4rem', marginBottom: '1rem'}}>🎉</div>
        <h1 className="text-h2 mb-4">Investimento Confirmado!</h1>
        <p className="text-body mb-6">
          Seu investimento em <strong>{offer?.issuer.trade_name}</strong> foi processado com sucesso e os tokens foram emitidos na blockchain Stellar.
        </p>

        {tx && (
          <div className="card p-4 mb-6" style={{backgroundColor: 'var(--kate-light-gray)', color: 'var(--kate-dark-blue)', textAlign: 'left', overflow: 'hidden'}}>
            <p style={{fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem'}}>Stellar Transaction Hash:</p>
            <p style={{fontFamily: 'monospace', fontSize: '0.875rem', wordBreak: 'break-all'}}>{tx}</p>
          </div>
        )}

        <div style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
          <Link href={`/offers/${id}`} className="btn-outline">
            Voltar para Oferta
          </Link>
          <Link href="/" className="btn-primary">
            Meu Portfólio
          </Link>
        </div>
      </div>
    </div>
  );
}
