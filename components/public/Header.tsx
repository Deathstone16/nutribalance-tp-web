import Wordmark from './Wordmark';
import SmoothAnchor from './SmoothAnchor';

const links = [
  { id: 'la-consulta', label: 'Cómo funciona' },
  { id: 'preguntas-frecuentes', label: 'Preguntas frecuentes' },
];

export default function PublicHeader({
  home = false,
  showRequestLink = true,
  showProfessionalName = !home,
}: {
  home?: boolean;
  showRequestLink?: boolean;
  showProfessionalName?: boolean;
}) {
  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido principal
      </a>
      <header className="public-header">
        <Wordmark showProfessionalName={showProfessionalName} />
        <nav className="desktop-nav" aria-label="Navegación principal">
          {links.map((link) =>
            home ? (
              <SmoothAnchor key={link.id} href={`#${link.id}`}>
                {link.label}
              </SmoothAnchor>
            ) : (
              <a key={link.id} href={`/#${link.id}`}>
                {link.label}
              </a>
            ),
          )}
          {showRequestLink && (
            <a className="btn" href="/solicitar-turno">
              Solicitar turno
            </a>
          )}
        </nav>
        <details className="mobile-nav">
          <summary>
            <span className="mobile-nav-label">Menú de navegación</span>
            <span className="mobile-nav-bars" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </summary>
          <nav aria-label="Navegación móvil">
            {links.map((link) =>
              home ? (
                <SmoothAnchor key={link.id} href={`#${link.id}`}>
                  {link.label}
                </SmoothAnchor>
              ) : (
                <a key={link.id} href={`/#${link.id}`}>
                  {link.label}
                </a>
              ),
            )}
            {showRequestLink && (
              <a className="btn" href="/solicitar-turno">
                Solicitar turno
              </a>
            )}
          </nav>
        </details>
      </header>
    </>
  );
}
