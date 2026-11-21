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

export default function ConfirmPage() {
  return (
    <div className="public-page editorial-home editorial-request">
      <PublicHeader showRequestLink={false} showProfessionalName={false} />
      <main className="request-main" id="contenido">
        <section className="request-intro" aria-labelledby="confirm-title">
          <Link href="/" className="back-link">
            Volver al inicio
          </Link>
          <div className="request-intro-layout">
            <div className="request-intro-copy">
              <span className="eyebrow">Confirmación de turno</span>
              <h1 id="confirm-title">
                <span>Un último paso</span>
                <span>
                  para tu <em>turno.</em>
                </span>
              </h1>
            </div>
            <div className="request-intro-aside">
              <span className="request-script">Un clic</span>
              <p>Confirmá que este es tu correo para dejar registrada tu solicitud de turno.</p>
            </div>
          </div>
        </section>
        <ConfirmEmail />
      </main>
      <HomeFooter onHomePage={false} currentPage="request" showProfessionalName={false} />
    </div>
  );
}
