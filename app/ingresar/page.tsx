import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LoginForm from '@/components/public/LoginForm';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Acceso profesional | NutriBalance',
  robots: { index: false, follow: false },
};
/** Acceso con el mismo lenguaje visual que el panel, sin mostrar el panel. */
export default function Login() {
  return (
    <div className="panel-login">
      <a className="skip-link" href="#contenido">
        Saltar al formulario de acceso
      </a>
      <main id="contenido" className="panel-login-main">
        <Link href="/" className="panel-login-brand">
          nutri<em>balance</em>
          <span>.</span>
        </Link>
        <section className="panel-login-card" aria-labelledby="login-title">
          <h1 id="login-title">Ingresá a tu consultorio</h1>
          <p>
            Usá los datos de tu cuenta profesional para gestionar pacientes, turnos e historias de
            consulta.
          </p>
          <LoginForm />
          <p className="panel-login-request">
            ¿Querés pedir una consulta? <Link href="/solicitar-turno">Solicitar turno</Link>
          </p>
        </section>
        <Link href="/" className="back-link">
          <ArrowLeft size={16} />
          Volver al inicio
        </Link>
      </main>
    </div>
  );
}
