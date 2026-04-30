export default function PrintBadgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ margin: 0, padding: 0, background: "white" }}>
      {children}
    </div>
  );
}
