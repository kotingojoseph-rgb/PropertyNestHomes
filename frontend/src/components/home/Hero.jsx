import { Button } from "@/components/ui/button";
import heroHouse from "@/assets/images/hero-house.jpg";
import SearchBar from "./SearchBar";


export default function Hero() {

  return (

<section
className="
relative
min-h-[90vh]
bg-cover
bg-center
"
style={{
backgroundImage:`url(${heroHouse})`
}}
>


<div className="absolute inset-0 bg-black/60" />


<div
className="
relative
z-10
mx-auto
flex
min-h-[90vh]
max-w-7xl
flex-col
items-center
justify-center
px-4
sm:px-6
text-center
text-white
"
>


<div
className="
mb-6
rounded-full
border
border-white/30
bg-white/10
px-4
py-2
text-xs
sm:text-sm
font-semibold
uppercase
tracking-widest
backdrop-blur
"
>

PropertyNestHomes • Global Real Estate Marketplace

</div>



<h1
className="
max-w-5xl
text-4xl
sm:text-5xl
md:text-7xl
font-bold
leading-tight
"
>

Find Exceptional Homes Around The World

</h1>



<p
className="
mt-5
max-w-3xl
text-base
sm:text-lg
md:text-2xl
text-gray-200
"
>

Discover luxury homes, apartments, villas, and investment properties from trusted sellers.

</p>



<div
className="
mt-8
flex
flex-col
sm:flex-row
gap-4
"
>


<Button
size="lg"
className="
rounded-xl
px-8
"
>

Explore Properties

</Button>


<Button
size="lg"
variant="secondary"
className="
rounded-xl
px-8
"
>

Contact Expert

</Button>


</div>




<div
className="
mt-8
w-full
max-w-4xl
"
>

<SearchBar />

</div>





<div
className="
mt-8
grid
grid-cols-2
gap-3
sm:flex
sm:flex-wrap
sm:justify-center
"
>

{
[
"✓ Verified Listings",
"✓ Trusted Agents",
"✓ Secure Transactions",
"✓ Worldwide Properties",
]
.map(item=>(

<div
key={item}
className="
rounded-full
border
border-white/20
bg-white/10
px-3
py-2
text-xs
sm:text-sm
backdrop-blur
"
>
{item}
</div>

))
}


</div>





<div
className="
mt-10
grid
w-full
grid-cols-2
gap-6
md:grid-cols-4
"
>

{
[
["18K+","Properties Listed"],
["95+","Countries Covered"],
["4,300+","Verified Agents"],
["$38B+","Property Value"]
]
.map(([number,label])=>(

<div key={label}>

<h2
className="
text-3xl
sm:text-4xl
font-bold
text-green-400
"
>
{number}
</h2>

<p
className="
text-xs
sm:text-sm
text-gray-300
"
>
{label}
</p>

</div>

))
}


</div>



</div>


</section>

  );

}
