/* eslint-disable @next/next/no-html-link-for-pages -- The landing fragment needs a full navigation from other public pages. */
import Wordmark from './Wordmark';

export default function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="footer-main">
        <Wordmark />
        <nav aria-label="Navegación de pie de página">
          <a href="/#la-consulta">Cómo funciona</a>
          <a href="/solicitar-turno">Solicitar turno</a>
          <a href="/ingresar">Acceso profesional</a>
        </nav>
      </div>
    </footer>
  );
}
