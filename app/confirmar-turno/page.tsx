import type { Metadata } from 'next';
import Link from 'next/link';
import PublicHeader from '@/components/public/Header';
import HomeFooter from '@/components/public/HomeFooter';
import ConfirmEmail from '@/components/public/ConfirmEmail';

export const dynamic = 'force-dynamic';
// El enlace lleva un token: no se indexa ni se envía como referer a otros sitios.
export const metadata: Metadata = {
  title: 'Confirmar turno | NutriBalance',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

/** Página de una sola tarea: el botón de confirmar queda en la primera pantalla. */
export default function ConfirmPage() {
  return (
    <div className="public-page editorial-home editorial-request">
      <PublicHeader showRequestLink={false} showProfessionalName={false} />
      <main className="request-main confirm-main" id="contenido">
        <Link href="/" className="back-link">
          Volver al inicio
        </Link>
        <ConfirmEmail />
      </main>
      <HomeFooter onHomePage={false} currentPage="request" showProfessionalName={false} />
    </div>
  );
}
