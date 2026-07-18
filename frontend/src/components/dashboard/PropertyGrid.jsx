import PropertyItem from "./PropertyItem";

export default function PropertyGrid({
  properties,
  onDelete,
}) {
  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <PropertyItem
          key={property.id}
          property={property}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
