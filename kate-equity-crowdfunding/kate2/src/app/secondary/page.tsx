import prisma from '@/lib/prisma';
import Link from 'next/link';

export default async function SecondaryMarketPage() {
  // Busca intenções de compra e venda abertas
  const intentions = await prisma.secondaryIntention.findMany({
    where: { status: 'open' },
    include: {
      token_asset: {
        include: { issuer: true }
      },
      user: {
        select: { full_name: true, role: true } // Não expor dados sensíveis
      }
    },
    orderBy: { created_at: 'desc' }
  });

  const sellOrders = intentions.filter(i => i.intention_type === 'sell');
  const buyOrders = intentions.filter(i => i.intention_type === 'buy');

  return (
    <div className="container section-padding">
      <div className="mb-8">
        <h1 className="text-h1">Mercado Secundário (KASE)</h1>
        <p className="text-body text-muted mt-2">
          Negocie seus tokens diretamente com outros investidores da plataforma de forma segura através da blockchain Stellar.
        </p>
      </div>

      <div className="content-grid" style={{gap: '4rem'}}>
        {/* Livro de Ofertas: Venda */}
        <div className="order-book-side">
          <h2 className="text-h2 mb-4" style={{color: '#ef4444'}}>Intenções de Venda</h2>
          <div className="card">
            {sellOrders.length > 0 ? (
              <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
                <thead>
                  <tr style={{borderBottom: '1px solid var(--border-color)'}}>
                    <th style={{padding: '1rem'}}>Ativo</th>
                    <th style={{padding: '1rem'}}>Qtd</th>
                    <th style={{padding: '1rem'}}>Preço Unit.</th>
                    <th style={{padding: '1rem'}}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {sellOrders.map(order => (
                    <tr key={order.id} style={{borderBottom: '1px solid var(--border-color)'}}>
                      <td style={{padding: '1rem'}}>
                        <strong>{order.token_asset.token_symbol}</strong>
                        <div className="text-small text-muted">{order.token_asset.issuer.trade_name}</div>
                      </td>
                      <td style={{padding: '1rem'}}>{order.quantity}</td>
                      <td style={{padding: '1rem', fontWeight: 'bold'}}>R$ {order.price_per_token?.toLocaleString('pt-BR')}</td>
                      <td style={{padding: '1rem'}}>
                        <Link href={`/secondary/trade/${order.id}`} className="btn-primary" style={{padding: '0.5rem 1rem', fontSize: '0.875rem'}}>
                          Comprar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{padding: '2rem', textAlign: 'center', color: 'var(--kate-dark-gray)'}}>
                Nenhuma intenção de venda no momento.
              </div>
            )}
          </div>
        </div>

        {/* Livro de Ofertas: Compra */}
        <div className="order-book-side">
          <h2 className="text-h2 mb-4" style={{color: '#10b981'}}>Intenções de Compra</h2>
          <div className="card">
            {buyOrders.length > 0 ? (
              <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
                <thead>
                  <tr style={{borderBottom: '1px solid var(--border-color)'}}>
                    <th style={{padding: '1rem'}}>Ativo</th>
                    <th style={{padding: '1rem'}}>Qtd</th>
                    <th style={{padding: '1rem'}}>Preço Unit.</th>
                    <th style={{padding: '1rem'}}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {buyOrders.map(order => (
                    <tr key={order.id} style={{borderBottom: '1px solid var(--border-color)'}}>
                      <td style={{padding: '1rem'}}>
                        <strong>{order.token_asset.token_symbol}</strong>
                        <div className="text-small text-muted">{order.token_asset.issuer.trade_name}</div>
                      </td>
                      <td style={{padding: '1rem'}}>{order.quantity}</td>
                      <td style={{padding: '1rem', fontWeight: 'bold'}}>R$ {order.price_per_token?.toLocaleString('pt-BR')}</td>
                      <td style={{padding: '1rem'}}>
                        <Link href={`/secondary/trade/${order.id}`} className="btn-outline" style={{padding: '0.5rem 1rem', fontSize: '0.875rem'}}>
                          Vender
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{padding: '2rem', textAlign: 'center', color: 'var(--kate-dark-gray)'}}>
                Nenhuma intenção de compra no momento.
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <Link href="/secondary/create-order" className="btn-outline">
          Criar Nova Ordem
        </Link>
      </div>
    </div>
  );
}
