const pool = require("../config/db");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const register = async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      phone,
      id_type,
      id_number
    } = req.body;
const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users
      (full_name, email, password, phone, id_type, id_number)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, full_name, email`,
      [
        full_name,
        email,
        hashedPassword,
        phone,
        id_type,
        id_number
      ]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

   if (!isMatch) {
  return res.status(401).json({
    message: "Invalid email or password"
  });
}

const token = jwt.sign(
  {
    id: user.id,
    email: user.email
  },
  "mysecretkey",
  {
    expiresIn: "1d"
  }
);

res.json({
  message: "Login successful",
  token
});

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
module.exports = {
  register,
  login
};
