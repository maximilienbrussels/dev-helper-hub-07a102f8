/**
 * Rustige plaatshouder terwijl een pagina laadt.
 *
 * Houdt de hoogte van een normale pagina vast (sfeerband + drie blokken),
 * zodat de voettekst onderaan blijft staan en niets verspringt zodra de
 * echte inhoud binnenkomt.
 */
export function PageSkeleton() {
  return (
    <div className="min-h-[70vh] w-full animate-pulse bg-background" aria-hidden="true">
      {/* Sfeerband bovenaan */}
      <div className="h-[38vh] min-h-[220px] w-full bg-muted/70" />

      <div className="mx-auto w-full max-w-5xl space-y-10 px-4 py-12">
        {/* Titelblok */}
        <div className="space-y-4">
          <div className="h-8 w-2/3 rounded-md bg-muted" />
          <div className="h-4 w-full rounded bg-muted/70" />
          <div className="h-4 w-5/6 rounded bg-muted/70" />
        </div>

        {/* Drie inhoudsblokken */}
        <div className="grid gap-6 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-40 w-full rounded-xl bg-muted/70" />
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted/70" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PageSkeleton;
