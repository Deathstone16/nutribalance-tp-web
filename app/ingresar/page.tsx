import type { Metadata } from 'next';
import Link from 'next/link';
import LoginForm from '@/components/public/LoginForm';
import PublicHeader from '@/components/public/Header';
import HomeFooter from '@/components/public/HomeFooter';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Acceso profesional | NutriBalance',
  robots: { index: false, follow: false },
};
export default function Login() {
  return (
    <div className="public-page editorial-home editorial-login">
      <PublicHeader showRequestLink={false} />
      <main id="contenido" className="professional-main">
        <section className="professional-intro" aria-labelledby="professional-title">
          <Link href="/" className="professional-back-link">
            Volver al inicio
          </Link>
          <div className="professional-intro-copy">
            <span className="eyebrow">Acceso profesional</span>
            <h1 id="professional-title">
              Tu espacio,
              <br />
              <em>a mano.</em>
            </h1>
            <p>
              Ingresá con tu cuenta autorizada para gestionar pacientes, turnos e historias de
              consulta.
            </p>
          </div>
          <div className="professional-areas" aria-label="Áreas del consultorio">
            <span>Agenda</span>
            <span>Pacientes</span>
            <span>Consultas</span>
          </div>
        </section>
        <section className="professional-form-area" aria-labelledby="login-title">
          <div className="professional-form-heading">
            <span className="professional-script">Bienvenido</span>
            <h2 id="login-title">Ingresá a tu espacio.</h2>
            <p>Usá los datos de la cuenta profesional autorizada.</p>
          </div>
          <LoginForm />
          <p className="professional-patient-link">
            ¿Querés pedir una consulta? <Link href="/solicitar-turno">Solicitar turno</Link>
          </p>
        </section>
      </main>
      <HomeFooter onHomePage={false} currentPage="login" />
    </div>
  );
}
