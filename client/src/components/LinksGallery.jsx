import { useState } from "react";
import {
FaLink,
FaExternalLinkAlt,
FaCopy,
FaSearch
} from "react-icons/fa";
import "../styles/linksgallery.css";

function LinksGallery({

open,

links,

onClose

}){

const [search,setSearch]=useState("");

if(!open) return null;

const filtered=links.filter(link=>

link.message
.toLowerCase()
.includes(search.toLowerCase())

);

return(

<div className="links-overlay">

<div className="links-modal">

<div className="links-header">

<h2>Shared Links</h2>

<button onClick={onClose}>✕</button>

</div>

<div className="links-search">

<FaSearch/>

<input
placeholder="Search..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
/>

</div>

<div className="links-list">

{

filtered.map(link=>(

<div
key={link.id}
className="link-item"
>

<FaLink className="link-icon"/>

<div className="link-info">

<h4>{link.message}</h4>

<span>

{link.sender} • {link.time}

</span>

</div>

<button

onClick={()=>{

navigator.clipboard.writeText(

link.message

)

}}

>

<FaCopy/>

</button>

<a

href={link.message}

target="_blank"

rel="noreferrer"

>

<FaExternalLinkAlt/>

</a>

</div>

))

}

</div>

</div>

</div>

);

}

export default LinksGallery;