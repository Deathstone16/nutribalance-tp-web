'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { CheckCircle2, MailCheck, TriangleAlert } from 'lucide-react';
import {
  confirmEmail,
  ExpressApiError,
  dateText,
  localDate,
  localTime,
  type EmailConfirmation,
} from '@/lib/express-api';

const TOKEN = /^[A-Za-z0-9_-]{43}$/;

/** Pantalla del enlace del correo. Confirma con un clic (no al cargar) para que los
 * escáneres de enlaces de los proveedores de correo no confirmen por la persona. */
export default function ConfirmEmail() {
  // undefined mientras se hidrata; luego el token válido del enlace, o null si falta o es inválido.
  const search = useSyncExternalStore(
    () => () => undefined,
    () => window.location.search,
    () => null,
  );
  const param = search === null ? undefined : (new URLSearchParams(search).get('token') ?? '');
  const token = param === undefined ? undefined : TOKEN.test(param) ? param : null;
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [done, setDone] = useState<EmailConfirmation | null>(null);
  const submitting = useRef(false),
    cardRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (done || error) cardRef.current?.focus();
  }, [done, error]);

  async function confirm() {
    if (!token || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      setDone(await confirmEmail(token));
    } catch (e) {
      const expired = e instanceof ExpressApiError && e.code === 'CONFIRMATION_EXPIRED';
      setError(
        expired
          ? 'El enlace venció y el horario se liberó. Pedí un nuevo turno.'
          : e instanceof ExpressApiError && e.code === 'CONFIRMATION_LINK_INVALID'
            ? 'Este enlace no es válido. Revisá que hayas abierto el último correo que te enviamos.'
            : e instanceof Error
              ? e.message
              : 'No pudimos confirmar el turno.',
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  if (token === undefined)
    return (
      <section className="request-success" role="status">
        <p>Revisando tu enlace…</p>
      </section>
    );

  if (done)
    return (
      <section ref={cardRef} tabIndex={-1} className="request-success" aria-live="polite">
        <span className="success-symbol">
          <CheckCircle2 size={31} />
        </span>
        <h1>
          Tu correo
          <br />
          está confirmado.
        </h1>
        <p>
          Recibimos tu confirmación. El consultorio revisa la solicitud y confirma el turno antes
          del encuentro.
        </p>
        <dl>
          <div>
            <dt>Fecha solicitada</dt>
            <dd>{dateText(localDate(new Date(done.startsAt)))}</dd>
          </div>
          <div>
            <dt>Horario solicitado</dt>
            <dd>{localTime(done.startsAt)} · Argentina</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>
              <span className="badge amber">
                {done.status === 'confirmed' ? 'Turno confirmado' : 'Pendiente de aprobación'}
              </span>
            </dd>
          </div>
        </dl>
        <Link className="btn" href="/">
          Volver al inicio
        </Link>
      </section>
    );

  if (token === null || error)
    return (
      <section ref={cardRef} tabIndex={-1} className="request-success" role="alert">
        <span className="success-symbol is-warning">
          <TriangleAlert size={31} />
        </span>
        <h1>
          No pudimos
          <br />
          confirmar el turno.
        </h1>
        <p>
          {token === null
            ? 'El enlace está incompleto. Abrí el botón del correo o copiá el enlace completo.'
            : error}
        </p>
        <Link className="btn" href="/solicitar-turno">
          Pedir un turno
        </Link>
      </section>
    );

  return (
    <section className="request-success" aria-live="polite">
      <span className="success-symbol">
        <MailCheck size={31} />
      </span>
      <h1>
        Confirmá
        <br />
        tu turno.
      </h1>
      <p>Tocá el botón para confirmar tu correo y dejar registrada tu solicitud de turno.</p>
      <button className="btn" type="button" disabled={busy} onClick={() => void confirm()}>
        {busy ? 'Confirmando…' : 'Confirmar mi turno'}
      </button>
    </section>
  );
}
