/**
 * History content: more width, less padding for easier reading of responses.
 */
export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="-mx-4 -my-5 sm:-mx-6 md:-my-6 px-2 py-3 sm:px-4 md:py-4">
      {children}
    </div>
  );
}
