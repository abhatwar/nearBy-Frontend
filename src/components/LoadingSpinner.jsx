export default function LoadingSpinner({ size = 'md', fullPage = false }) {
  const sizes = { sm: 'h-5 w-5', md: 'h-10 w-10', lg: 'h-16 w-16' };

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/70 z-50">
        <div className={`animate-spin rounded-full border-4 border-blue-600 border-t-transparent ${sizes[size]}`} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className={`animate-spin rounded-full border-4 border-blue-600 border-t-transparent ${sizes[size]}`} />
    </div>
  );
}
