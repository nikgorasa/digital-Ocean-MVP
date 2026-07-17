import Link from "next/link";

export default function PackageNotFound() {
  return (
    <main className="min-h-screen bg-brand-ivory flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-brand-antique-gold mb-4">404</div>
        <h1 className="text-2xl font-bold text-brand-charcoal mb-2 font-display">
          Package Not Found
        </h1>
        <p className="text-brand-charcoal/60 mb-8">
          This holiday package may have been removed or is no longer available. Browse our
          current packages to find your next trip.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/holidays"
            className="px-6 py-3 bg-brand-antique-gold text-white rounded-lg font-semibold hover:bg-brand-dark-gold transition-colors"
          >
            Browse Packages
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border-2 border-brand-charcoal/20 text-brand-charcoal rounded-lg font-semibold hover:border-brand-antique-gold hover:text-brand-antique-gold transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
