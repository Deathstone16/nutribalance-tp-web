'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ExpressApiError, resendConfirmation } from '@/lib/express-api';

const WAIT_SECONDS = 60;

/** Salida para quien no recibió el correo o escribió mal la dirección en la solicitud. */
export default function ResendConfirmation({
  requestId,
  email,
  onEmailChange,
}: {
  requestId: string;
  email: string;
  onEmailChange: (email: string) => void;
}) {
  const [until, setUntil] = useState(() => Date.now() + WAIT_SECONDS * 1000),
    [now, setNow] = useState(() => Date.now()),
    [busy, setBusy] = useState(false),
    [changing, setChanging] = useState(false),
    [done, setDone] = useState(false),
    [expired, setExpired] = useState(false),
    [fieldError, setFieldError] = useState(''),
    [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const submitting = useRef(false);
  const seconds = Math.max(0, Math.ceil((until - now) / 1000));
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  async function send(newEmail?: string) {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setStatus(null);
    setFieldError('');
    try {
      const result = await resendConfirmation(requestId, newEmail);
      onEmailChange(result.sentTo);
      setNow(Date.now());
      setUntil(Date.now() + WAIT_SECONDS * 1000);
      setChanging(false);
      setStatus({
        tone: 'ok',
        text: result.emailChanged
          ? `Listo: te enviamos un correo nuevo a ${result.sentTo}.`
          : `Te reenviamos el correo a ${result.sentTo}. El enlace anterior ya no sirve.`,
      });
    } catch (e) {
      if (e instanceof ExpressApiError) {
        if (e.code === 'RESEND_TOO_SOON' && e.retryAfter) {
          setNow(Date.now());
          setUntil(Date.now() + e.retryAfter * 1000);
        }
        if (e.code === 'ALREADY_CONFIRMED') {
          setDone(true);
          setStatus({ tone: 'ok', text: 'Tu correo ya está confirmado. Podés cerrar esta página.' });
          return;
        }
        if (e.code === 'CONFIRMATION_EXPIRED') setExpired(true);
        const detail = e.details.find((item) => item.field === 'contactEmail');
        if (detail) setFieldError(detail.message);
        setStatus({ tone: 'error', text: e.message });
      } else setStatus({ tone: 'error', text: 'No pudimos reenviar el correo. Probá de nuevo.' });
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  function submitNewEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get('newEmail') || '').trim();
    if (value) void send(value);
  }

  if (done)
    return (
      <p className="request-resend-status is-ok" role="status">
        {status?.text}
      </p>
    );
  return (
    <div className="request-resend">
      <h3>¿No te llegó, o la dirección está mal?</h3>
      <div className="request-resend-actions">
        <button
          type="button"
          className="btn secondary"
          disabled={busy || seconds > 0 || expired}
          onClick={() => void send()}
        >
          {busy ? 'Enviando…' : seconds > 0 ? `Reenviar correo (${seconds} s)` : 'Reenviar correo'}
        </button>
        <button
          type="button"
          className="textbutton"
          aria-expanded={changing}
          aria-controls="resend-change-email"
          disabled={expired}
          onClick={() => setChanging((value) => !value)}
        >
          Cambiar mi correo
        </button>
      </div>
      {changing && (
        <form id="resend-change-email" className="request-resend-form" onSubmit={submitNewEmail}>
          <label>
            Correo correcto
            <input
              name="newEmail"
              type="email"
              required
              autoComplete="off"
              maxLength={254}
              placeholder="nombre@dominio.com"
              defaultValue=""
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? 'resend-email-error' : undefined}
              disabled={busy}
            />
            {fieldError && (
              <span className="field-error" id="resend-email-error">
                {fieldError}
              </span>
            )}
          </label>
          <p className="request-field-hint">
            Ahora lo mandamos a <strong>{email}</strong>. Si lo cambiás, el enlace anterior deja de
            servir.
          </p>
          <button className="btn" type="submit" disabled={busy || seconds > 0 || expired}>
            {busy ? 'Enviando…' : seconds > 0 ? `Enviar (${seconds} s)` : 'Enviar a este correo'}
          </button>
        </form>
      )}
      {status && (
        <p
          className={status.tone === 'ok' ? 'request-resend-status is-ok' : 'request-resend-status'}
          role="status"
        >
          {status.text}{' '}
          {expired && (
            <Link className="textbutton" href="/solicitar-turno">
              Pedir un turno nuevo
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
