import { FaHome } from "react-icons/fa";

function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        backgroundColor: "#0F172A",
        color: "white",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <FaHome size={30} color="#16A34A" />
        <h2>PropertyNestHomes</h2>
      </div>

      <div
        style={{
          display: "flex",
          gap: "25px",
        }}
      >
        <a href="#" style={{ color: "white", textDecoration: "none" }}>Home</a>
        <a href="#" style={{ color: "white", textDecoration: "none" }}>Buy</a>
        <a href="#" style={{ color: "white", textDecoration: "none" }}>Rent</a>
        <a href="#" style={{ color: "white", textDecoration: "none" }}>Sell</a>
        <a href="#" style={{ color: "white", textDecoration: "none" }}>About</a>
      </div>

      <div
        style={{
          display: "flex",
          gap: "15px",
        }}
      >
        <button>Login</button>
        <button>Register</button>
      </div>
    </nav>
  );
}

export default Navbar;
