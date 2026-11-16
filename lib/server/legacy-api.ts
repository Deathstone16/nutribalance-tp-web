/** The Vercel branch uses Express; the old D1 endpoints do not serve data. */
export function legacyApiDisabled() {
  return Response.json(
    {
      error: {
        code: 'LEGACY_API_DISABLED',
        message: 'Esta versión utiliza la API de NutriBalance en /api/v1.',
      },
    },
    { status: 410, headers: { 'Cache-Control': 'no-store' } },
  );
}
