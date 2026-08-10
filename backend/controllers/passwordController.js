const pool = require("../config/db");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../services/emailService");


// Request password reset
exports.forgotPassword = async (req, res) => {
  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required"
      });
    }


    const userResult = await pool.query(
      "SELECT id, email FROM users WHERE email=$1",
      [email.toLowerCase()]
    );


    if (userResult.rows.length === 0) {
      return res.json({
        message:
        "If this email exists, a reset link will be created"
      });
    }


    const user = userResult.rows[0];

await pool.query(
  `
  DELETE FROM password_resets
  WHERE user_id = $1
  `,
  [user.id]
);

    const token = crypto
      .randomBytes(32)
      .toString("hex");


    const expires = new Date();

    expires.setMinutes(
      expires.getMinutes() + 15
    );


    await pool.query(
      `
      INSERT INTO password_resets
      (user_id, token, expires_at)
      VALUES($1,$2,$3)
      `,
      [
        user.id,
        token,
        expires
      ]
    );


    const frontendUrl =
  process.env.FRONTEND_URL ||
  "https://propertynesthomes-frontend.onrender.com";

const resetUrl =
  `${frontendUrl}/reset-password/${token}`;

await sendEmail(
  user.email,
  "Reset your PropertyNestHomes password",
  `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
      <h2>Password Reset</h2>

      <p>We received a request to reset your PropertyNestHomes password.</p>

      <p>
        Click the button below to choose a new password.
        This link expires in 15 minutes.
      </p>

      <p>
        <a
          href="${resetUrl}"
          style="
            display:inline-block;
            padding:12px 20px;
            background:#16a34a;
            color:white;
            text-decoration:none;
            border-radius:6px;
          "
        >
          Reset Password
        </a>
      </p>

      <p>If you did not request this, you can safely ignore this email.</p>
    </div>
  `
);

res.json({
  message:
  "If this email exists, a password reset link has been sent"
});


  } catch(error){

    console.error(error);

    res.status(500).json({
      error:error.message
    });

  }
};




// Reset password
exports.resetPassword = async (req,res)=>{

try{

const { token } = req.params;

const { password } = req.body;


if(!password){

return res.status(400).json({
error:"Password required"
});

}



const reset = await pool.query(
`
SELECT *
FROM password_resets
WHERE token=$1
AND expires_at > NOW()
`,
[token]
);



if(reset.rows.length===0){

return res.status(400).json({
error:"Invalid or expired token"
});

}



const userId =
reset.rows[0].user_id;



const hashedPassword =
await bcrypt.hash(password,12);



await pool.query(
`
UPDATE users
SET password=$1
WHERE id=$2
`,
[
hashedPassword,
userId
]
);



await pool.query(
`
DELETE FROM password_resets
WHERE token=$1
`,
[token]
);



res.json({
message:"Password reset successful"
});


}catch(error){

res.status(500).json({
error:error.message
});

}

};
