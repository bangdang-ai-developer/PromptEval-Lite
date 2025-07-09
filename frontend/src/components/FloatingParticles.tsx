const FloatingParticles = () => {
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Floating particles */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-blue-300 rounded-full animate-pulse opacity-20" />
      <div className="absolute top-40 right-20 w-1 h-1 bg-indigo-400 rounded-full animate-pulse opacity-30" />
      <div className="absolute top-60 left-1/3 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse opacity-25" />
      <div className="absolute bottom-40 right-10 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-20" />
      <div className="absolute bottom-60 left-20 w-1 h-1 bg-indigo-300 rounded-full animate-pulse opacity-30" />
      <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse opacity-25" />
      
      {/* Gradient orbs */}
      <div className="absolute top-10 right-1/4 w-32 h-32 bg-gradient-to-br from-blue-200/10 to-indigo-200/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-br from-purple-200/10 to-pink-200/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute top-1/2 right-10 w-24 h-24 bg-gradient-to-br from-indigo-200/10 to-blue-200/10 rounded-full blur-xl animate-pulse" />
    </div>
  );
};

export default FloatingParticles;