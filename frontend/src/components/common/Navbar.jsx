import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {

  const navigate = useNavigate();
  const [menuOpen,setMenuOpen] = useState(false);

  const token = localStorage.getItem("token");


  function logout(){

    localStorage.removeItem("token");
    setMenuOpen(false);
    navigate("/");

  }


  const links = [
    {name:"Home",path:"/"},
    {name:"Buy",path:"/buy"},
    {name:"About",path:"/about"},
    {name:"Contact",path:"/contact"}
  ];


  return (

<nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b shadow-sm">

<div className="
mx-auto
flex
items-center
justify-between
max-w-7xl
px-4
py-3
">


<Link
to="/"
className="
font-extrabold
text-lg
sm:text-xl
text-green-700
whitespace-nowrap
"
>
🏡 <span className="hidden sm:inline">
PropertyNestHomes
</span>
<span className="sm:hidden">
PNH
</span>

</Link>



<button

className="
md:hidden
rounded-lg
border
px-3
py-2
text-xl
"

onClick={()=>setMenuOpen(!menuOpen)}

>

☰

</button>



<div className="
hidden
md:flex
items-center
gap-6
font-medium
">


{links.map(link=>(

<Link
key={link.path}
to={link.path}
className="hover:text-green-600 transition"
>

{link.name}

</Link>

))}



{
token ?

<>

<Link
to="/dashboard"
className="
rounded-lg
bg-green-600
px-4
py-2
text-white
"
>
Dashboard
</Link>


<button
onClick={logout}
className="
rounded-lg
bg-red-600
px-4
py-2
text-white
"
>
Logout
</button>


</>

:

<>

<Link to="/login">
Login
</Link>


<Link
to="/register"
className="
rounded-lg
bg-green-600
px-4
py-2
text-white
"
>
Register
</Link>

</>

}



</div>


</div>



{
menuOpen &&

<div className="
md:hidden
border-t
bg-white
shadow-lg
">

{
links.map(link=>(

<Link
key={link.path}
to={link.path}
onClick={()=>setMenuOpen(false)}
className="
block
px-5
py-3
border-b
hover:bg-gray-50
"
>

{link.name}

</Link>

))

}



{
token ?

<>

<Link
to="/dashboard"
onClick={()=>setMenuOpen(false)}
className="
block
px-5
py-3
"
>
Dashboard
</Link>


<button
onClick={logout}
className="
w-full
text-left
px-5
py-3
bg-red-600
text-white
"
>
Logout
</button>

</>

:

<>

<Link
to="/login"
className="block px-5 py-3"
>
Login
</Link>


<Link
to="/register"
className="
block
px-5
py-3
bg-green-600
text-white
"
>
Register
</Link>

</>

}


</div>

}


</nav>

  );

}
