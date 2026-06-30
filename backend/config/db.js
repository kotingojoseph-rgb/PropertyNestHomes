const { Pool } = require("pg");

const pool = new Pool({
  user: "propertyadmin",
  host: "localhost",
  database: "propertynesthomes",
  password: "StrongPassword123!",
  port: 5432,
});

module.exports = pool;
