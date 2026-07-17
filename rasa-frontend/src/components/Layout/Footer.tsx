export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      className="flex flex-col sm:flex-row justify-center items-center text-[11px] font-medium pointer-events-auto w-full"
      style={{ gap: "8px", color: "#a1a1aa" }}
    >
      <div className="flex items-center gap-2">
        <span>&copy; {year} TenantIQ</span>
        <span>&bull;</span>
        <a href="#" className="hover:text-indigo transition-colors">Copyright Policy</a>
      </div>
      <div className="hidden sm:block">&bull;</div>
      <div>
        Contact: <a href="mailto:tenantiq.team@gmail.com" className="hover:text-indigo transition-colors">tenantiq.team@gmail.com</a>
      </div>
    </footer>
  );
}
