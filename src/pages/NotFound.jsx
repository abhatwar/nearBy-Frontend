import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 text-center">
      <div>
        <p className="text-8xl mb-4">🗺️</p>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">404 – Lost?</h1>
        <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
        <Link
          to="/"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
