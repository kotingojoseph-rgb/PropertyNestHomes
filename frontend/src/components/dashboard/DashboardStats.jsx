export default function DashboardStats({ totalProperties }) {
  const stats = [
    {
      title: "Total Properties",
      value: totalProperties,
      icon: "🏠",
    },
    {
      title: "For Sale",
      value: totalProperties,
      icon: "🏷️",
    },
    {
      title: "Total Views",
      value: 0,
      icon: "👁️",
    },
    {
      title: "Favorites",
      value: 0,
      icon: "❤️",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 md:mb-10 md:grid-cols-4">

      {stats.map((stat) => (
        <div
          key={stat.title}
          className="min-w-0 rounded-2xl border bg-white p-4 shadow-md transition hover:shadow-lg sm:p-5 md:p-6"
        >

          <div className="flex min-w-0 items-start justify-between gap-2">

            <h2 className="min-w-0 text-[10px] font-semibold uppercase leading-tight text-gray-500 sm:text-xs sm:text-sm">
              {stat.title}
            </h2>

            <span className="shrink-0 text-2xl sm:text-3xl">
              {stat.icon}
            </span>

          </div>


          <p className="mt-3 text-2xl font-bold text-gray-900 sm:mt-5 sm:text-3xl md:text-4xl">
            {stat.value}
          </p>


        </div>
      ))}

    </div>
  );
}
