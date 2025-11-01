import { useState, useEffect } from "react";
import { getCars, bookCar } from "./api";
import "./App.css";

export default function App() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ 
    from: "", 
    to: "", 
    user: "", 
    email: "", 
    phone: "" 
  });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchCars();
  }, [q, category]);

  async function fetchCars() {
    setLoading(true);
    setMsg("");
    try {
      const carData = await getCars(q, category);
      setCars(carData);
    } catch (error) {
      setMsg("⚠️ Error fetching cars. Please try again.");
      console.error("Error fetching cars:", error);
    } finally {
      setLoading(false);
    }
  }

  function validateForm() {
    const newErrors = {};
    
    // Date validation
    if (!form.from.trim()) newErrors.from = "Pick-up date is required";
    if (!form.to.trim()) newErrors.to = "Return date is required";
    if (form.from && form.to) {
      const startDate = new Date(form.from);
      const endDate = new Date(form.to);
      if (startDate >= endDate) {
        newErrors.to = "Return date must be after pick-up date";
      }
      if (startDate < new Date()) {
        newErrors.from = "Pick-up date cannot be in the past";
      }
    }
    
    // Personal information validation
    if (!form.user.trim()) newErrors.user = "Full name is required";
    if (!form.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!isValidEmail(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!isValidPhone(form.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  function resetForm() {
    setForm({ from: "", to: "", user: "", email: "", phone: "" });
    setErrors({});
    setSelected(null);
    setMsg("");
  }

  async function handleBook() {
    if (!validateForm()) {
      setMsg("❌ Please fix the errors above");
      return;
    }

    setBookingLoading(true);
    setMsg("");
    try {
      await bookCar({ ...form, carId: selected.id });
      setMsg("✅ Booking successful! We have sent a confirmation to your email.");
      setTimeout(() => {
        resetForm();
      }, 2000);
    } catch (error) {
      let errorMessage = "❌ Booking failed. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = `🚫 ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `❌ ${error.message}`;
      }
      
      setMsg(errorMessage);
    } finally {
      setBookingLoading(false);
    }
  }

  function handleInputChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    // Clear general message when user starts fixing errors
    if (msg && (msg.includes("❌") || msg.includes("🚫"))) {
      setMsg("");
    }
  }

  function handleCloseForm() {
    resetForm();
  }

  // Calculate number of days and total price
  const calculateTotal = () => {
    if (!form.from || !form.to) return 0;
    const start = new Date(form.from);
    const end = new Date(form.to);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * (selected?.price || 0);
  };

  const rentalDays = form.from && form.to 
    ? Math.ceil((new Date(form.to) - new Date(form.from)) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="dashboard">
      <header className="header">
        <h2>🚗 Car Rental Dashboard</h2>
      </header>

      <div className="filters">
        <input
          placeholder="Search cars by name..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="search-input"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="category-select"
        >
          <option value="">All Categories</option>
          <option value="economy">Economy</option>
          <option value="suv">SUV</option>
          <option value="electric">Electric</option>
          <option value="luxury">Luxury</option>
        </select>
      </div>

      {loading && <p className="loading">Loading available cars...</p>}
      
      {/* Global success message (outside popup) */}
      {msg && msg.includes("✅") && (
        <div className="message success">
          {msg}
        </div>
      )}

      <div className="car-grid">
        {cars.length === 0 && !loading ? (
          <div className="no-cars">
            <p>No cars found matching your criteria. Try adjusting your search.</p>
          </div>
        ) : (
          cars.map((car) => (
            <div
              key={car.id}
              className="car-card"
              onClick={() => {
                setSelected(car);
                setMsg("");
              }}
            >
              <img src={car.image} alt={car.name} />
              <div className="car-info">
                <h4>{car.name}</h4>
                <p>
                  {car.category} • {car.price} KD/day
                </p>
                {car.transmission && (
                  <div className="car-features">
                    <span>🔧 {car.transmission}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {selected && (
        <div className="booking-modal">
          <div className="booking-form">
            <div className="form-header">
              <h3>Book {selected.name}</h3>
              <button 
                className="close-btn" 
                onClick={handleCloseForm}
                aria-label="Close booking form"
                disabled={bookingLoading}
              >
                ×
              </button>
            </div>
            
            <div className="car-summary">
              <img src={selected.image} alt={selected.name} />
              <div>
                <h4>{selected.name}</h4>
                <p>{selected.category} • {selected.price} KD/day</p>
                {selected.transmission && (
                  <p className="car-detail">Transmission: {selected.transmission}</p>
                )}
              </div>
            </div>

            {/* Popup error/success messages */}
            {msg && (
              <div className={`form-message ${msg.includes("✅") ? "success" : "error"}`}>
                {msg}
                {msg.includes("already booked") && (
                  <div className="suggestion">
                    💡 Try selecting different dates to check availability
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label>Rental Period *</label>
              <div className="date-inputs">
                <div className="input-group">
                  <label htmlFor="from-date">Pick-up Date & Time</label>
                  <input
                    id="from-date"
                    type="datetime-local"
                    value={form.from}
                    onChange={(e) => handleInputChange("from", e.target.value)}
                    className={errors.from ? "error" : ""}
                    min={new Date().toISOString().slice(0, 16)}
                    disabled={bookingLoading}
                    placeholder="Select pick-up date and time"
                  />
                  {errors.from && <span className="error-text">{errors.from}</span>}
                </div>
                <div className="input-group">
                  <label htmlFor="to-date">Return Date & Time</label>
                  <input
                    id="to-date"
                    type="datetime-local"
                    value={form.to}
                    onChange={(e) => handleInputChange("to", e.target.value)}
                    className={errors.to ? "error" : ""}
                    min={form.from || new Date().toISOString().slice(0, 16)}
                    disabled={bookingLoading}
                    placeholder="Select return date and time"
                  />
                  {errors.to && <span className="error-text">{errors.to}</span>}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Personal Information</label>
              <input
                placeholder="Enter your full name *"
                value={form.user}
                onChange={(e) => handleInputChange("user", e.target.value)}
                className={errors.user ? "error" : ""}
                disabled={bookingLoading}
              />
              {errors.user && <span className="error-text">{errors.user}</span>}
              
              <input
                type="email"
                placeholder="Enter your email address *"
                value={form.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={errors.email ? "error" : ""}
                disabled={bookingLoading}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
              
              <input
                type="tel"
                placeholder="Enter your phone number *"
                value={form.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={errors.phone ? "error" : ""}
                disabled={bookingLoading}
              />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>

            {form.from && form.to && rentalDays > 0 && (
              <div className="price-summary">
                <h4>Booking Summary</h4>
                <div className="price-details">
                  <div className="price-row">
                    <span>{selected.price} KD × {rentalDays} day{rentalDays > 1 ? 's' : ''}</span>
                    <span>{selected.price * rentalDays} KD</span>
                  </div>
                  <div className="price-total">
                    <strong>Total Amount</strong>
                    <strong>{calculateTotal()} KD</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="buttons">
              <button 
                className="btn-success" 
                onClick={handleBook}
                disabled={bookingLoading}
              >
                {bookingLoading ? "Processing Booking..." : `Confirm Booking - ${calculateTotal()} KD`}
              </button>
              <button 
                className="btn-cancel" 
                onClick={handleCloseForm}
                disabled={bookingLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}