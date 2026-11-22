'use client';
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import * as api from '@/lib/express-api';

const message = (e: unknown) =>
  e instanceof Error ? e.message : 'No pudimos completar la acción.';

/** La profesional agenda a un paciente existente: elige ficha, fecha y horario; el turno nace confirmado. */
export default function NewAppointment({
  initialPatient,
  busy,
  error,
  today,
  onCreate,
  onCancel,
}: {
  initialPatient?: api.Patient;
  busy: boolean;
  error: unknown;
  today: string;
  onCreate: (patient: api.Patient, date: string, startsAt: string) => void;
  onCancel: () => void;
}) {
  const [search, setSearch] = useState(''),
    [found, setFound] = useState<{ query: string; data: api.Patient[]; error: string } | null>(
      null,
    ),
    [selected, setSelected] = useState<api.Patient | null>(initialPatient ?? null),
    [date, setDate] = useState(''),
    [slotsState, setSlotsState] = useState<{
      date: string;
      slots: api.Slot[];
      error: string;
    } | null>(null),
    [slot, setSlot] = useState('');
  useEffect(() => {
    if (selected) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api
        .listPatients(search, 1, controller.signal)
        .then((value) => {
          if (!controller.signal.aborted) setFound({ query: search, data: value.data, error: '' });
        })
        .catch((e) => {
          if (!controller.signal.aborted) setFound({ query: search, data: [], error: message(e) });
        });
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [search, selected]);
  useEffect(() => {
    if (!date) return;
    const controller = new AbortController();
    api
      .availability(date, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setSlotsState({ date, slots: value.slots, error: '' });
      })
      .catch((e) => {
        if (!controller.signal.aborted) setSlotsState({ date, slots: [], error: message(e) });
      });
    return () => controller.abort();
  }, [date]);
  const loadingPatients = !selected && found?.query !== search;
  const loadingSlots = !!date && slotsState?.date !== date;
  const slots = slotsState?.date === date ? slotsState : null;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (selected && slot) onCreate(selected, date, slot);
      }}
    >
      <p>Cargá un turno para un paciente que ya tiene ficha. Queda confirmado al guardar.</p>
      {selected ? (
        <p className="express-dialog-subject">
          <strong>{api.fullName(selected)}</strong>
          {selected.documentNumber && <span> · DNI {selected.documentNumber}</span>}{' '}
          {!initialPatient && (
            <button
              type="button"
              className="textbutton"
              disabled={busy}
              onClick={() => {
                setSelected(null);
                setSearch('');
                setFound(null);
              }}
            >
              Cambiar
            </button>
          )}
        </p>
      ) : (
        <>
          <label>
            Paciente *
            <input
              value={search}
              disabled={busy}
              placeholder="Buscar por nombre, apellido o DNI"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          {loadingPatients ? (
            <p role="status">Buscando pacientes…</p>
          ) : found?.error ? (
            <p role="alert">{found.error}</p>
          ) : (
            <div className="express-patient-picker">
              {found?.data.map((patient) => (
                <button
                  type="button"
                  key={patient.id}
                  className="express-choice"
                  onClick={() => setSelected(patient)}
                >
                  <span>
                    <strong>{api.fullName(patient)}</strong>
                    <small>
                      {patient.documentNumber || 'Sin DNI'} · {patient.phone}
                    </small>
                  </span>
                </button>
              ))}
              {found && !found.data.length && <p>No hay fichas para esta búsqueda.</p>}
            </div>
          )}
        </>
      )}
      <fieldset disabled={busy || !selected}>
        <label>
          Fecha *
          <input
            type="date"
            value={date}
            min={today}
            max={api.addDays(today, 60)}
            required
            onChange={(event) => {
              setDate(event.target.value);
              setSlot('');
            }}
          />
        </label>
        <div className="express-slot-field" role="group" aria-labelledby="new-slot-label">
          <span id="new-slot-label" className="express-slot-label">
            Horario *
          </span>
          {!date ? (
            <p className="express-slot-hint">Primero elegí una fecha.</p>
          ) : loadingSlots ? (
            <p className="express-slot-hint" role="status">
              Buscando horarios…
            </p>
          ) : slots?.error ? (
            <p className="express-slot-hint" role="alert">
              {slots.error}
            </p>
          ) : slots && slots.slots.length ? (
            <div className="express-slot-grid">
              {slots.slots.map((item) => (
                <button
                  type="button"
                  key={item.startsAt}
                  className={slot === item.startsAt ? 'express-slot selected' : 'express-slot'}
                  aria-pressed={slot === item.startsAt}
                  onClick={() => setSlot(item.startsAt)}
                >
                  {api.localTime(item.startsAt)}
                </button>
              ))}
            </div>
          ) : (
            <p className="express-slot-hint">
              No hay horarios ese día. Se atiende de lunes a viernes; probá con otra fecha.
            </p>
          )}
        </div>
      </fieldset>
      {error ? (
        <div className="form-error" role="alert">
          {message(error)}
        </div>
      ) : null}
      <div className="modal-footer">
        <button className="btn secondary" disabled={busy} type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="btn" disabled={busy || !selected || !slot} type="submit">
          <Check size={17} />
          {busy ? 'Guardando…' : 'Crear turno'}
        </button>
      </div>
    </form>
  );
}
