export function MeshBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-cyan-50" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-200 rounded-full blur-[120px] opacity-30 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-200 rounded-full blur-[100px] opacity-25 animate-pulse" />
      <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-cyan-200 rounded-full blur-[80px] opacity-20" />
    </div>
  );
}
