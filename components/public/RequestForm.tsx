'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MailCheck } from 'lucide-react';
import {
  availability,
  requestAppointment,
  ExpressApiError,
  localDate,
  localTime,
  dateText,
  addDays,
  type Slot,
  type RequestReceipt,
} from '@/lib/express-api';

export default function RequestForm() {
  const today = localDate(),
    [chosenDate, setChosenDate] = useState(''),
    [chosenSlot, setChosenSlot] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]),
    [loading, setLoading] = useState(false),
    [slotError, setSlotError] = useState(''),
    [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [receipt, setReceipt] = useState<RequestReceipt | null>(null),
    [sentTo, setSentTo] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}),
    [waitUntil, setWaitUntil] = useState(0);
  const submitting = useRef(false),
    successRef = useRef<HTMLElement>(null),
    errorRef = useRef<HTMLDivElement>(null),
    slotsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!chosenDate) return;
    const controller = new AbortController();
    availability(chosenDate, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setSlots(result.slots);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setSlotError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [chosenDate, refresh]);
  useEffect(() => {
    if (receipt) successRef.current?.focus();
    else if (error) errorRef.current?.focus();
  }, [receipt, error]);
  function selectDate(date: string) {
    setChosenDate(date);
    setChosenSlot('');
    setSlots([]);
    setSlotError('');
    setLoading(!!date);
  }
  function retrySlots() {
    setChosenSlot('');
    setSlots([]);
    setSlotError('');
    setLoading(true);
    setRefresh((value) => value + 1);
  }
  const fieldError = (name: string) =>
    fieldErrors[name] ? (
      <span className="field-error" id={name + '-error'}>
        {fieldErrors[name]}
      </span>
    ) : null;
  const errorProps = (name: string) => ({
    'aria-invalid': !!fieldErrors[name],
    'aria-describedby': fieldErrors[name] ? name + '-error' : undefined,
  });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    if (Date.now() < waitUntil) {
      setError('Esperá un momento antes de volver a enviar.');
      return;
    }
    const fields = new FormData(event.currentTarget);
    if (fields.get('website')) return;
    const selectedSlot = String(fields.get('startsAt') || '');
    if (!slots.some((slot) => slot.startsAt === selectedSlot)) {
      setFieldErrors((previous) => ({ ...previous, startsAt: 'Elegí un horario disponible.' }));
      slotsRef.current?.focus();
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError('');
    setFieldErrors({});
    try {
      const result = await requestAppointment({
        contactName: String(fields.get('contactName')).trim(),
        contactPhone: String(fields.get('contactPhone') || '').trim(),
        contactEmail: String(fields.get('contactEmail') || '').trim(),
        contactDocumentNumber: String(fields.get('contactDocumentNumber') || '').trim(),
        startsAt: selectedSlot,
      });
      setSentTo(String(fields.get('contactEmail') || '').trim());
      setReceipt(result);
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos confirmar el envío.');
      if (e instanceof ExpressApiError) {
        setFieldErrors(Object.fromEntries(e.details.map((item) => [item.field, item.message])));
        if (e.code === 'SLOT_UNAVAILABLE') retrySlots();
        if (e.retryAfter) setWaitUntil(Date.now() + e.retryAfter * 1000);
      }
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  if (receipt)
    return (
      <section ref={successRef} tabIndex={-1} className="request-success" aria-live="polite">
        <span className="success-symbol">
          <MailCheck size={31} />
        </span>
        <h2>
          Falta un paso:
          <br />
          confirmá en tu correo.
        </h2>
        <p>
          Te enviamos un correo a <strong>{sentTo}</strong>. Abrilo y tocá{' '}
          <strong>“Confirmar mi turno”</strong> para dejar registrada tu solicitud.
        </p>
        <dl>
          <div>
            <dt>Fecha solicitada</dt>
            <dd>{dateText(localDate(new Date(receipt.startsAt)))}</dd>
          </div>
          <div>
            <dt>Horario solicitado</dt>
            <dd>{localTime(receipt.startsAt)} · Argentina</dd>
          </div>
          {receipt.confirmationExpiresAt && (
            <div>
              <dt>Confirmalo antes de las</dt>
              <dd>{localTime(receipt.confirmationExpiresAt)} · Argentina</dd>
            </div>
          )}
          <div>
            <dt>Estado</dt>
            <dd>
              <span className="badge amber">Esperando tu confirmación por correo</span>
            </dd>
          </div>
          <div>
            <dt>Código de solicitud</dt>
            <dd className="receipt-code">{receipt.id}</dd>
          </div>
        </dl>
        <p className="request-success-note">
          ¿No lo ves? Revisá la carpeta de spam. Si no lo confirmás a tiempo, el horario se libera
          y vas a tener que pedir el turno de nuevo.
        </p>
        <Link className="btn" href="/">
          Volver al inicio
        </Link>
      </section>
    );
  return (
    <form
      onSubmit={submit}
      className="request-form"
      aria-busy={busy}
      onInvalid={(event) => {
        const field = event.target as HTMLInputElement;
        setFieldErrors((previous) => ({
          ...previous,
          [field.name]: field.validity.valueMissing
            ? field.name === 'startsAt'
              ? 'Elegí un horario disponible.'
              : 'Completá este campo.'
            : field.name === 'contactDocumentNumber'
              ? 'Ingresá un DNI de 7 a 9 números, sin puntos.'
              : 'Revisá el valor ingresado.',
        }));
      }}
      onInput={(event) => {
        const field = event.target as HTMLInputElement;
        setFieldErrors((previous) => {
          const next = { ...previous };
          delete next[field.name];
          return next;
        });
      }}
    >
      <fieldset disabled={busy}>
        <legend>Datos para contactarte</legend>
        <p className="field-section-note">Los campos con * son obligatorios.</p>
        <label>
          Nombre y apellido *
          <input
            name="contactName"
            autoComplete="off"
            maxLength={160}
            required
            placeholder="Ana Ejemplo"
            {...errorProps('contactName')}
          />
          {fieldError('contactName')}
        </label>
        <div className="form-grid">
          <label>
            DNI *
            <input
              name="contactDocumentNumber"
              inputMode="numeric"
              autoComplete="off"
              pattern="[0-9]{7,9}"
              minLength={7}
              maxLength={9}
              required
              placeholder="Sin puntos"
              aria-describedby={
                fieldErrors.contactDocumentNumber
                  ? 'contactDocumentNumber-error contactDocumentNumber-hint'
                  : 'contactDocumentNumber-hint'
              }
              aria-invalid={!!fieldErrors.contactDocumentNumber}
            />
            <span className="request-field-hint" id="contactDocumentNumber-hint">
              Si ya te atendiste, te reconocemos por tu DNI.
            </span>
            {fieldError('contactDocumentNumber')}
          </label>
          <label>
            Teléfono *
            <input
              name="contactPhone"
              type="tel"
              autoComplete="off"
              minLength={6}
              maxLength={30}
              required
              placeholder="000 000 0000"
              {...errorProps('contactPhone')}
            />
            {fieldError('contactPhone')}
          </label>
        </div>
        <label>
          Correo electrónico *
          <input
            name="contactEmail"
            type="email"
            autoComplete="off"
            maxLength={254}
            required
            placeholder="ana@example.test"
            aria-describedby={
              fieldErrors.contactEmail ? 'contactEmail-error contactEmail-hint' : 'contactEmail-hint'
            }
            aria-invalid={!!fieldErrors.contactEmail}
          />
          <span className="request-field-hint" id="contactEmail-hint">
            Te enviamos un correo para confirmar el turno.
          </span>
          {fieldError('contactEmail')}
        </label>
      </fieldset>
      <fieldset disabled={busy}>
        <legend>Elegí tu próximo encuentro</legend>
        <p className="field-section-note">
          Consultas de 30 minutos. Todos los horarios son de Argentina.
        </p>
        <div className="form-grid">
          <label>
            Fecha *
            <input
              type="date"
              name="date"
              value={chosenDate}
              onChange={(event) => selectDate(event.target.value)}
              min={today}
              max={addDays(today, 60)}
              required
              {...errorProps('date')}
            />
            {fieldError('date')}
          </label>
          <div
            ref={slotsRef}
            tabIndex={-1}
            className={fieldErrors.startsAt ? 'request-slot-field has-error' : 'request-slot-field'}
            role="group"
            aria-labelledby="slot-label"
            aria-describedby={fieldErrors.startsAt ? 'startsAt-error' : undefined}
          >
            <span id="slot-label" className="request-slot-label">
              Horario disponible *
            </span>
            {chosenDate && slots.length > 0 ? (
              <div key={`${chosenDate}-${refresh}`} className="request-slot-grid">
                {slots.map((slot, index) => (
                  <label
                    key={slot.startsAt}
                    className={
                      chosenSlot === slot.startsAt
                        ? 'request-slot-option selected'
                        : 'request-slot-option'
                    }
                  >
                    <input
                      type="radio"
                      name="startsAt"
                      value={slot.startsAt}
                      required={index === 0}
                      aria-describedby={fieldErrors.startsAt ? 'startsAt-error' : undefined}
                      onChange={() => setChosenSlot(slot.startsAt)}
                    />
                    <span>{localTime(slot.startsAt)}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p
                className={`request-slot-hint ${loading ? 'is-loading' : slotError ? 'is-error' : chosenDate ? 'is-empty' : 'is-idle'}`}
                role="status"
              >
                {loading
                  ? 'Buscando horarios…'
                  : slotError
                    ? 'No pudimos mostrar horarios.'
                    : chosenDate
                      ? 'No hay horarios para esta fecha. Probá con otro día.'
                      : 'Primero elegí una fecha.'}
              </p>
            )}
            {fieldError('startsAt')}
          </div>
        </div>
        {slotError && (
          <div className="form-error" role="alert">
            {slotError}{' '}
            <button className="textbutton" type="button" onClick={retrySlots}>
              Volver a buscar
            </button>
          </div>
        )}
      </fieldset>
      <label className="honeypot" aria-hidden="true">
        Sitio web
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      {chosenDate && chosenSlot && (
        <div className="request-summary" aria-live="polite">
          <strong>
            {dateText(chosenDate)} · {localTime(chosenSlot)}
          </strong>
          <p>Vas a recibir un correo para confirmar tu solicitud.</p>
        </div>
      )}
      {error && (
        <div ref={errorRef} tabIndex={-1} className="form-error" role="alert">
          {error}
        </div>
      )}
      <button className="btn request-submit" type="submit" disabled={busy}>
        {busy ? 'Registrando solicitud…' : 'Enviar solicitud'}
      </button>
    </form>
  );
}
