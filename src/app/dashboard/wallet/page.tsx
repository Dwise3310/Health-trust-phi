export default function WalletPage() {
  return (
    <main className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h1 className="text-3xl">Wallet</h1>
        <p className="mt-2 text-sm text-muted">
          1 Health equals 100 naira. USD is a display conversion only.
          Your funding account number is unique and permanent once the
          database trigger has run.
        </p>
      </div>
      <section className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted">Balance</p>
        <p className="mt-2 font-serif text-4xl tabular-nums">0 Health</p>
        <p className="mt-1 text-sm text-muted">₦0 · waiting for first fund</p>
        <p className="mt-6 text-sm">
          Account number appears here after you connect Supabase and run
          the SQL pack. Pay into that number from any Nigerian bank.
        </p>
      </section>
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl">Move money</h2>
        <p className="mt-2 text-sm text-muted">
          Withdrawals go Health to naira, then to your local bank. Payment
          provider wiring comes next. No hidden cash-out fee will be
          invented on this screen.
        </p>
      </section>
    </main>
  );
}
