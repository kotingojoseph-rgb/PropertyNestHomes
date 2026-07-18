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
      id_number,
    } = req.body;

    // Basic validation
    if (!full_name || !email || !password) {
      return res.status(400).json({
        error: "Full name, email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Password policy
    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long.",
      });
    }

    // Check if email already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: "Email is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `
      INSERT INTO users
      (
        full_name,
        email,
        password,
        phone,
        id_type,
        id_number
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING
        id,
        full_name,
        email,
        role
      `,
      [
        full_name.trim(),
        normalizedEmail,
        hashedPassword,
        phone || null,
        id_type || null,
        id_number || null,
      ]
    );

    return res.status(201).json({
      message: "User registered successfully.",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Registration failed.",
    });
  }
};

const login = async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: "Server configuration error.",
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Login failed.",
    });
  }
};

module.exports = {
  register,
  login,
};
