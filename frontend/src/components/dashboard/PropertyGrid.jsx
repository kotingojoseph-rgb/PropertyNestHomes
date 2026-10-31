import PropertyItem from "./PropertyItem";

export default function PropertyGrid({
  properties,
  promotions,
  promotingPropertyId,
  onPromote,
  onDelete,
  onEdit,
  onView,
}) {
  return (
    <div className="grid min-w-0 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <PropertyItem
          key={property.id}
          property={property}
          promotions={promotions}
          promotingPropertyId={promotingPropertyId}
          onPromote={onPromote}
          onDelete={onDelete}
          onEdit={onEdit}
          onView={onView}
        />
      ))}
    </div>
  );
}
