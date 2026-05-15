import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Portfólio — Kate Equity' }

// This page redirects to the actual portfolio page at /portfolio
export default function DashboardPortfolioRedirect() {
  redirect('/portfolio')
}
