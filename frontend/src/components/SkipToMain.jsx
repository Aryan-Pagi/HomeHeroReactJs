/**
 * Skip to Main Content Link
 * Improves keyboard navigation by allowing users to skip directly to main content
 * Visible only when focused (keyboard navigation)
 */
function SkipToMain() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-cyan-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}

export default SkipToMain;
