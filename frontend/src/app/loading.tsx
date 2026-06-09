export default function Loading() {
  return (
    <div className="flex h-[80vh] w-full items-center justify-center">
      <div className="relative flex items-center justify-center h-12 w-12">
        <div className="absolute h-full w-full rounded-full bg-red-500/20 animate-ping"></div>
        <div className="absolute h-6 w-6 rounded-full bg-gradient-to-tr from-red-600 to-red-400 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse"></div>
      </div>
    </div>
  );
}
