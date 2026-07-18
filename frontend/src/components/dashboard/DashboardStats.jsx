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
    <div className="grid gap-6 mb-10 md:grid-cols-4">

      {stats.map((stat) => (
        <div
          key={stat.title}
          className="rounded-2xl bg-white p-6 shadow-md border hover:shadow-lg transition"
        >

          <div className="flex items-center justify-between">

            <h2 className="text-sm font-semibold text-gray-500 uppercase">
              {stat.title}
            </h2>

            <span className="text-3xl">
              {stat.icon}
            </span>

          </div>


          <p className="mt-5 text-4xl font-bold text-gray-900">
            {stat.value}
          </p>


        </div>
      ))}

    </div>
  );
}
