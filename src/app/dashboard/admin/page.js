export default function AdminDashboard() {
  return (
    <main className="min-h-screen bg-[#07090e] flex items-center justify-center px-6 text-center">
      <section className="max-w-md">
        <h1 className="font-display text-2xl font-black text-slate-100 uppercase tracking-wider">
          Panel administrativo
        </h1>
        <p className="mt-3 text-sm font-semibold text-[#10b981]">
          Diagnóstico temporal
        </p>
        <p className="mt-4 text-sm text-slate-300">
          La autenticación funcionó correctamente.
        </p>
      </section>
    </main>
  );
}
