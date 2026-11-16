import Wordmark from './Wordmark';
import SmoothAnchor from './SmoothAnchor';

export default function HomeFooter({
  onHomePage = true,
  currentPage,
  showProfessionalName = !onHomePage,
}: {
  onHomePage?: boolean;
  currentPage?: 'request' | 'login';
  showProfessionalName?: boolean;
}) {
  const sectionLink = (id: string, label: string) =>
    onHomePage ? (
      <SmoothAnchor href={`#${id}`}>{label}</SmoothAnchor>
    ) : (
      <a href={`/#${id}`}>{label}</a>
    );
  return (
    <footer className="home-footer">
      <div className="home-footer-grid">
        <div className="home-footer-brand">
          <Wordmark showProfessionalName={showProfessionalName} />
          <p>
            {showProfessionalName
              ? 'Consultas nutricionales de 30 minutos con Mauricio Pelozo.'
              : 'Consultas nutricionales de 30 minutos.'}
          </p>
        </div>
        <nav aria-label="Conocer NutriBalance">
          <h2>Conocé</h2>
          {sectionLink('la-consulta', 'Cómo funciona')}
          {sectionLink('preguntas-frecuentes', 'Preguntas frecuentes')}
        </nav>
        <nav aria-label="Preguntas sobre la consulta">
          <h2>Antes de empezar</h2>
          {sectionLink('faq-duracion', 'Duración de la consulta')}
          {sectionLink('faq-confirmacion', 'Confirmación del turno')}
          {sectionLink('faq-seguimiento', 'Seguimiento')}
        </nav>
        <nav aria-label="Accesos de NutriBalance">
          <h2>Tu espacio</h2>
          {currentPage !== 'request' && <a href="/solicitar-turno">Solicitar turno</a>}
          {currentPage !== 'login' && <a href="/ingresar">Acceso profesional</a>}
        </nav>
      </div>
    </footer>
  );
}
