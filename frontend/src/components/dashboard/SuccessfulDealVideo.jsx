import successfulDealVideo from "../../assets/videos/successful-deal-web.mp4";

export default function SuccessfulDealVideo() {
  return (
    <section className="my-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Successful Deal
            </h2>
            <p className="mt-1 text-sm text-gray-500">
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
          controls
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="Two business professionals completing a successful property deal"
        >
          Your browser does not support the video element.
        </video>
      </div>

      <div className="flex items-center gap-2 px-6 py-4 text-sm text-gray-600">
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
        <span>Successful property transaction</span>
      </div>
    </section>
  );
}
