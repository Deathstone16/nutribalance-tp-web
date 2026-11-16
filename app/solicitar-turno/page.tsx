import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';
import PublicHeader from '@/components/public/Header';
import HomeFooter from '@/components/public/HomeFooter';
import RequestForm from '@/components/public/RequestForm';

export const metadata: Metadata = {
  title: 'Solicitar turno · Mauricio Pelozo | NutriBalance',
  description:
    'Consultá los horarios disponibles y solicitá tu turno con Mauricio Pelozo. El encuentro queda pendiente de confirmación.',
  alternates: { canonical: '/solicitar-turno' },
};

export default function RequestPage() {
  return (
    <div className="public-page editorial-home editorial-request">
      <PublicHeader showRequestLink={false} />
      <main className="request-main" id="contenido">
        <section className="request-intro" aria-labelledby="request-title">
          <Link href="/" className="back-link">
            Volver al inicio
          </Link>
          <div className="request-intro-layout">
            <div className="request-intro-copy">
              <span className="eyebrow">Solicitud de turno</span>
              <h1 id="request-title">
                <span>Elegí un momento</span>
                <span>
                  para <em>conversar.</em>
                </span>
              </h1>
            </div>
            <div className="request-intro-aside">
              <span className="request-script">30 minutos</span>
              <p>
                Elegí una fecha y un horario disponible. Mauricio revisa tu solicitud y confirma el
                turno antes del encuentro.
              </p>
              <ul>
                <li>
                  <Check size={17} />
                  Recibís un código de solicitud.
                </li>
                <li>
                  <Check size={17} />
                  El turno queda pendiente de confirmación.
                </li>
                <li>
                  <Check size={17} />
                  Todos los horarios son de Argentina.
                </li>
              </ul>
            </div>
          </div>
        </section>
        <RequestForm />
      </main>
      <HomeFooter onHomePage={false} currentPage="request" />
    </div>
  );
}
