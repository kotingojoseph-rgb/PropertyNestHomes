const pool = require("../config/db");

const seedProperties = async () => {
  try {
    const properties = [
      {
        title: "Luxury 5 Bedroom Duplex",
        description: "Modern smart home with swimming pool",
        price: 250000000,
        location: "Yenagoa",
        country: "Nigeria",
        state_province: "Bayelsa",
        city: "Yenagoa",
        address: "Opolo Road",
        postal_code: "561101",
        currency: "NGN",
        bedrooms: 5,
        bathrooms: 6,
        property_type: "Duplex",
        status: "Available",
        owner_id: 4
      },
      {
        title: "Luxury Apartment",
        description: "Beautiful apartment in Lekki Phase 1",
        price: 180000000,
        location: "Lekki",
        country: "Nigeria",
        state_province: "Lagos",
        city: "Lekki",
        address: "Admiralty Way",
        postal_code: "106104",
        currency: "NGN",
        bedrooms: 4,
        bathrooms: 4,
        property_type: "Apartment",
        status: "Available",
        owner_id: 4
      },
      {
        title: "Executive Villa",
        description: "Luxury villa in Wuse",
        price: 300000000,
        location: "Abuja",
        country: "Nigeria",
        state_province: "FCT",
        city: "Abuja",
        address: "Wuse Zone 6",
        postal_code: "900288",
        currency: "NGN",
        bedrooms: 6,
        bathrooms: 7,
        property_type: "Villa",
        status: "Available",
        owner_id: 4
      },
      {
        title: "Modern Family House",
        description: "Beautiful home in Dallas",
        price: 650000,
        location: "Dallas",
        country: "United States",
        state_province: "Texas",
        city: "Dallas",
        address: "Oak Street",
        postal_code: "75201",
        currency: "USD",
        bedrooms: 4,
        bathrooms: 3,
        property_type: "House",
        status: "Available",
        owner_id: 4
      },
      {
        title: "Downtown Condo",
        description: "Luxury condo in Toronto",
        price: 890000,
        location: "Toronto",
        country: "Canada",
        state_province: "Ontario",
        city: "Toronto",
        address: "King Street",
        postal_code: "M5H 2N2",
        currency: "CAD",
        bedrooms: 3,
        bathrooms: 2,
        property_type: "Condo",
        status: "Available",
        owner_id: 4
      },
      {
        title: "Luxury Penthouse",
        description: "Skyline view of Shanghai",
        price: 5200000,
        location: "Shanghai",
        country: "China",
        state_province: "Shanghai",
        city: "Shanghai",
        address: "Pudong District",
        postal_code: "200120",
        currency: "CNY",
        bedrooms: 5,
        bathrooms: 5,
        property_type: "Penthouse",
        status: "Available",
        owner_id: 4
      }
    ];

    for (const property of properties) {
      await pool.query(
        `INSERT INTO properties
        (
          title,
          description,
          price,
          location,
          country,
          state_province,
          city,
          address,
          postal_code,
          currency,
          bedrooms,
          bathrooms,
          property_type,
          status,
          owner_id
        )
        VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          property.title,
          property.description,
          property.price,
          property.location,
          property.country,
          property.state_province,
          property.city,
          property.address,
          property.postal_code,
          property.currency,
          property.bedrooms,
          property.bathrooms,
          property.property_type,
          property.status,
          property.owner_id
        ]
      );
    }

    console.log("✅ Sample properties inserted successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await pool.end();
  }
};

seedProperties();
