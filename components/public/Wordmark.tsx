import Link from 'next/link';

export default function Wordmark({
  showProfessionalName = true,
}: {
  showProfessionalName?: boolean;
}) {
  return (
    <Link
      className="wordmark"
      href="/"
      aria-label={
        showProfessionalName ? 'NutriBalance, Mauricio Pelozo, inicio' : 'NutriBalance, inicio'
      }
    >
      <span>
        nutri<em>balance</em>
        <span className="wordmark-point">.</span>
      </span>
      {showProfessionalName && <small>Mauricio Pelozo</small>}
    </Link>
  );
}
