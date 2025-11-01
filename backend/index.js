import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

// Load cars data
const cars = JSON.parse(fs.readFileSync(new URL("./mock-data.json", import.meta.url)));
let bookings = [];
let nextBookingId = 1;

// Get all cars with filtering
app.get("/cars", (req, res) => {
  const { q = "", category = "" } = req.query;
  
  const filtered = cars.filter(car => 
    (!q || car.name.toLowerCase().includes(q.toLowerCase())) && 
    (!category || car.category.toLowerCase() === category.toLowerCase())
  );
  
  res.json(filtered);
});

// Create a booking
app.post("/bookings", (req, res) => {
  const { carId, from, to, user, email, phone } = req.body;
  
  // Validate required fields
  if (!carId || !from || !to || !user || !email || !phone) {
    return res.status(400).json({ 
      message: "All fields are required: carId, from, to, user, email, phone" 
    });
  }
  
  // Validate dates
  const startDate = new Date(from);
  const endDate = new Date(to);
  
  if (isNaN(startDate) || isNaN(endDate)) {
    return res.status(400).json({ message: "Invalid date format" });
  }
  
  if (startDate >= endDate) {
    return res.status(400).json({ message: "End date must be after start date" });
  }
  
  // Check if car exists
  const car = cars.find(c => c.id === parseInt(carId));
  if (!car) {
    return res.status(404).json({ message: "Car not found" });
  }
  
  // Check for booking conflicts and get conflicting booking details
  const conflictingBooking = bookings.find(booking => 
    booking.carId === parseInt(carId) &&
    new Date(booking.from) <= endDate &&
    new Date(booking.to) >= startDate
  );
  
  if (conflictingBooking) {
    const conflictStart = new Date(conflictingBooking.from).toLocaleDateString();
    const conflictEnd = new Date(conflictingBooking.to).toLocaleDateString();
    
    return res.status(409).json({ 
      message: `Car is already booked from ${conflictStart} to ${conflictEnd}. Please choose different dates.`,
      conflictingDates: {
        from: conflictingBooking.from,
        to: conflictingBooking.to
      }
    });
  }
  
  // Create new booking
  const newBooking = {
    id: nextBookingId++,
    carId: parseInt(carId),
    from,
    to,
    user,
    email,
    phone,
    carName: car.name,
    carImage: car.image,
    totalPrice: calculateTotalPrice(car.price, startDate, endDate),
    createdAt: new Date().toISOString()
  };
  
  bookings.push(newBooking);
  res.status(201).json(newBooking);
});

// Get all bookings (for admin purposes)
app.get("/bookings", (req, res) => {
  res.json(bookings);
});

// Get bookings for a specific car
app.get("/cars/:carId/bookings", (req, res) => {
  const { carId } = req.params;
  const carBookings = bookings.filter(booking => booking.carId === parseInt(carId));
  res.json(carBookings);
});

// Get available dates for a specific car
app.get("/cars/:carId/availability", (req, res) => {
  const { carId } = req.params;
  const carBookings = bookings.filter(booking => booking.carId === parseInt(carId));
  
  const bookedDates = carBookings.map(booking => ({
    from: booking.from,
    to: booking.to
  }));
  
  res.json({
    carId: parseInt(carId),
    bookedDates
  });
});

// Health check
app.get("/", (req, res) => {
  res.json({ 
    message: "Car Rental API is running",
    endpoints: {
      cars: "GET /cars?q=&category=",
      bookings: "POST /bookings",
      allBookings: "GET /bookings",
      carBookings: "GET /cars/:carId/bookings",
      availability: "GET /cars/:carId/availability"
    }
  });
});

// Helper function to calculate total price
function calculateTotalPrice(pricePerDay, startDate, endDate) {
  const timeDiff = Math.abs(endDate - startDate);
  const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  return days * pricePerDay;
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`🚗 Available cars: ${cars.length}`);
});