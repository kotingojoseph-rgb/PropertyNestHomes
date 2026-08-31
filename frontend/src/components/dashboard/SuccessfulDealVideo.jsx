import successfulDealVideo from "../../assets/videos/successful-deal-web.mp4";

export default function SuccessfulDealVideo() {
  return (
    <section className="my-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="p-4 pb-3 sm:p-6 sm:pb-4">
        <div className="flex min-w-0 items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="break-words text-xl font-bold text-gray-900">
              Successful Deal
            </h2>
            <p className="mt-1 break-words text-sm text-gray-500">
              Building successful property relationships with PropertyNestHomes.
            </p>
          </div>

          <div className="hidden rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700 sm:block">
            Deal Completed
          </div>
        </div>
      </div>

      <div className="relative bg-black">
        <video
          className="block aspect-video w-full object-cover"
          src={successfulDealVideo}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label="Successful PropertyNestHomes property transaction"
        >
          Your browser does not support the video element.
        </video>
      </div>

      <div className="flex min-w-0 items-center gap-2 px-4 py-4 text-sm text-gray-600 sm:px-6">
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
        <span className="min-w-0 break-words">Successful property transaction</span>
      </div>
    </section>
  );
}
