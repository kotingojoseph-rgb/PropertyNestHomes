const pool = require("../config/db");
const crypto = require("crypto");
const bcrypt = require("bcrypt");


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


    res.json({
      message:
      "Password reset request created",
      token
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
