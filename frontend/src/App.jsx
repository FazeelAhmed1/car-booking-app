import { useState,useEffect } from "react";
import { getCars,bookCar } from "./api";
export default function App(){
const[cars,setCars]=useState([]),[loading,setLoading]=useState(false),[q,setQ]=useState(""),[category,setCategory]=useState(""),[selected,setSelected]=useState(null),[form,setForm]=useState({from:"",to:"",user:""}),[msg,setMsg]=useState("");
useEffect(()=>{fetchCars();},[q,category]);
async function fetchCars(){setLoading(true);setMsg("");try{setCars(await getCars(q,category));}catch{setMsg("Error fetching cars");}setLoading(false);}
async function handleBook(){setMsg("");try{await bookCar({...form,carId:selected.id});setMsg("Booking successful");setSelected(null);setForm({from:"",to:"",user:""});}catch(e){setMsg(e?.response?.data?.message||"Booking failed");}}
return(<div style={{padding:20,fontFamily:"Arial"}}>
<h2>Car Rental Dashboard</h2>
<div style={{marginBottom:10}}>
<input placeholder="Search" value={q} onChange={e=>setQ(e.target.value)} style={{marginRight:10,padding:6}}/>
<select value={category} onChange={e=>setCategory(e.target.value)} style={{padding:6}}>
<option value="">All</option><option value="economy">Economy</option><option value="suv">SUV</option><option value="electric">Electric</option><option value="luxury">Luxury</option>
</select></div>
{loading&&<p>Loading...</p>}{msg&&<p>{msg}</p>}
<div style={{display:"flex",flexWrap:"wrap",gap:10}}>
{cars.map(c=>(<div key={c.id} style={{border:"1px solid #ccc",padding:10,width:200,cursor:"pointer",borderRadius:6}} onClick={()=>setSelected(c)}>
<img src={c.image} width="180" height="110" alt={c.name} style={{objectFit:"cover",borderRadius:4}}/>
<h4 style={{margin:"8px 0"}}>{c.name}</h4>
<p style={{margin:0}}>{c.category} – ${c.price}/day</p></div>))}
</div>
{selected&&(<div style={{marginTop:20}}>
<h3>Book {selected.name}</h3>
<div style={{display:"flex",gap:8,marginBottom:8}}>
<input placeholder="From (YYYY-MM-DD)" value={form.from} onChange={e=>setForm({...form,from:e.target.value})}/>
<input placeholder="To (YYYY-MM-DD)" value={form.to} onChange={e=>setForm({...form,to:e.target.value})}/>
<input placeholder="Your name" value={form.user} onChange={e=>setForm({...form,user:e.target.value})}/>
<button onClick={handleBook}>Submit</button></div></div>)}</div>);
}
