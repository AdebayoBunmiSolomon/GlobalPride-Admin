import { Link } from "react-router-dom";

export const NotFound = () => {
  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        {/* Big 404 */}
        <h1 className="text-8xl font-extrabold text-gray-200 dark:text-gray-700">
          404
        </h1>

        {/* Message */}
        <h2 className="mt-4 text-2xl font-semibold text-gray-800 dark:text-gray-100">
          Page not found
        </h2>

        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Sorry, the page you are looking for doesn’t exist or has been moved.
        </p>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            Go to Login
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};
