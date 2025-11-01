import axios from "axios";
const BASE="http://localhost:4000";
export async function getCars(q="",category=""){const r=await axios.get(`${BASE}/cars`,{params:{q,category}});return r.data;}
export async function bookCar(d){const r=await axios.post(`${BASE}/bookings`,d);return r.data;}
