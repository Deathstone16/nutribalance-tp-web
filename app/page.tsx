import type { Metadata } from 'next';
import Image from 'next/image';
import PublicHeader from '@/components/public/Header';
import HomeFooter from '@/components/public/HomeFooter';

export const metadata: Metadata = {
  title: 'NutriBalance | Atención nutricional',
  description:
    'Una consulta nutricional de 30 minutos para hablar sobre tus hábitos y tu rutina. Elegí un horario para enviar una solicitud.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'NutriBalance · Atención nutricional',
    description: 'Hablemos de cómo comés hoy.',
    url: '/',
  },
};

const steps = [
  {
    title: 'Elegí fecha y horario',
    description: 'Consultá los horarios disponibles y enviá tu solicitud.',
  },
  {
    title: 'Esperá la confirmación',
    description: 'Recibís un código de solicitud. El horario queda pendiente de confirmación.',
  },
  {
    title: 'Continuá en cada consulta',
    description:
      'Los objetivos y las indicaciones quedan registrados para retomarlos en el siguiente encuentro.',
  },
];

export default function Home() {
  return (
    <div className="public-page editorial-home">
      <PublicHeader home />
      <main id="contenido" className="public-main">
        <section className="editorial-hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow">Atención nutricional</span>
            <h1 id="hero-title">
              <span>Hablemos</span>
              <span>de cómo</span>
              <span>
                comés <em>hoy.</em>
              </span>
            </h1>
            <p>
              Una consulta de 30 minutos para revisar tus hábitos, entender tus horarios y organizar
              los próximos pasos.
            </p>
          </div>
          <div className="hero-media">
            <figure className="hero-image">
              <Image
                src="/images/plato-cotidiano.jpg"
                fill
                sizes="(max-width: 800px) 100vw, 560px"
                alt="Plato con vegetales, legumbres y cereales sobre una mesa de cocina"
                priority
                unoptimized
              />
            </figure>
            <div className="hero-stamp" aria-label="Consultas de 30 minutos">
              <strong>30</strong>
              <span>
                MINUTOS
                <br />
                DE CONSULTA
              </span>
            </div>
            <span className="hero-photo-note">Una conversación que empieza por tus días.</span>
          </div>
        </section>
        <section id="la-consulta" className="booking-section" aria-labelledby="booking-title">
          <div className="booking-intro">
            <span className="booking-script">Tres pasos simples</span>
            <h2 id="booking-title">
              <span>De la solicitud</span>
              <span>al seguimiento.</span>
            </h2>
            <p>
              Enviar el formulario registra una solicitud pendiente. El turno se confirma después de
              revisar el horario.
            </p>
          </div>
          <ol className="booking-steps">
            {steps.map((step) => (
              <li key={step.title}>
                <div className="step-copy">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="preguntas-frecuentes" className="public-faq" aria-labelledby="faq-title">
          <div className="faq-heading">
            <span className="faq-script">Antes de empezar</span>
            <h2 id="faq-title">Preguntas frecuentes</h2>
            <p>Lo esencial sobre la solicitud y la consulta, explicado con claridad.</p>
          </div>
          <div className="faq-grid">
            <article id="faq-duracion" className="faq-card">
              <div className="faq-card-top">
                <h3>¿Cuánto dura la consulta?</h3>
              </div>
              <p>
                Cada consulta dura 30 minutos. Los horarios disponibles se muestran al elegir una
                fecha.
              </p>
            </article>
            <article id="faq-confirmacion" className="faq-card">
              <div className="faq-card-top">
                <h3>¿La solicitud confirma mi turno?</h3>
              </div>
              <p>
                No. Al enviar el formulario recibís un código de solicitud y el turno queda
                pendiente. Se revisa el pedido antes de confirmar el turno.
              </p>
            </article>
            <article id="faq-seguimiento" className="faq-card">
              <div className="faq-card-top">
                <h3>¿Cómo continúa el seguimiento?</h3>
              </div>
              <p>
                En cada consulta se registran objetivos e indicaciones para retomarlos en el
                siguiente encuentro.
              </p>
            </article>
          </div>
          <a className="home-request-cta faq-cta" href="/solicitar-turno">
            Solicitar turno
          </a>
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}
