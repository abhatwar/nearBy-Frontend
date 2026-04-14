import { useNavigate } from 'react-router-dom';

export default function BackButton({ fallback = '/', label = 'Back', className = '' }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallback);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium ${className}`.trim()}
    >
      <span aria-hidden="true">←</span>
      <span>{label}</span>
    </button>
  );
}
