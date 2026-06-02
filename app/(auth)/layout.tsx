export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-primary/20 to-transparent" />
      {children}
    </main>
  );
}
