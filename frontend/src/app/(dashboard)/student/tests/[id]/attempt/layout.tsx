// This layout intentionally renders children bare — no sidebar, no shell.
// Both the exam attempt page and the result/analysis page live here and
// manage their own full-screen fixed overlay UI.
export default function AttemptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
