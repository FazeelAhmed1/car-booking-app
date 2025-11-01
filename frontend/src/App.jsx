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
      setCars(await getCars(q, category));
    } catch {
      setMsg("⚠️ Error fetching cars");
    }
    setLoading(false);
  }

  function validateForm() {
    const newErrors = {};
    
    if (!form.from) newErrors.from = "Start date is required";
    if (!form.to) newErrors.to = "End date is required";
    if (form.from && form.to && new Date(form.from) >= new Date(form.to)) {
      newErrors.to = "End date must be after start date";
    }
    if (!form.user.trim()) newErrors.user = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!form.phone.trim()) newErrors.phone = "Phone is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function resetForm() {
    setForm({ from: "", to: "", user: "", email: "", phone: "" });
    setErrors({});
    setSelected(null);
    setMsg("");
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
      setMsg("✅ Booking successful!");
      setTimeout(() => {
        resetForm();
      }, 1500);
    } catch (e) {
      // Handle 409 conflict with specific date information
      let errorMessage = "❌ Booking failed";
      
      if (e.response?.data?.message) {
        // Use the backend's detailed message
        errorMessage = `🚫 ${e.response.data.message}`;
      } else if (e.message) {
        errorMessage = `❌ ${e.message}`;
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
          placeholder="Search by name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="economy">Economy</option>
          <option value="suv">SUV</option>
          <option value="electric">Electric</option>
          <option value="luxury">Luxury</option>
        </select>
      </div>

      {loading && <p className="loading">Loading cars...</p>}
      
      {/* Global success message (outside popup) */}
      {msg && msg.includes("✅") && (
        <div className="message success">
          {msg}
        </div>
      )}

      <div className="car-grid">
        {cars.map((c) => (
          <div
            key={c.id}
            className="car-card"
            onClick={() => {
              setSelected(c);
              setMsg("");
            }}
          >
            <img src={c.image} alt={c.name} />
            <div className="car-info">
              <h4>{c.name}</h4>
              <p>
                {c.category} • ${c.price}/day
              </p>
              <div className="car-features">
                <span>⭐ {c.rating || "4.5"}</span>
                <span>🔧 {c.transmission || "Automatic"}</span>
              </div>
            </div>
          </div>
        ))}
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
                <p>{selected.category} • ${selected.price}/day</p>
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
                  />
                  {errors.to && <span className="error-text">{errors.to}</span>}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Personal Information</label>
              <input
                placeholder="Full Name *"
                value={form.user}
                onChange={(e) => handleInputChange("user", e.target.value)}
                className={errors.user ? "error" : ""}
                disabled={bookingLoading}
              />
              {errors.user && <span className="error-text">{errors.user}</span>}
              
              <input
                type="email"
                placeholder="Email Address *"
                value={form.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={errors.email ? "error" : ""}
                disabled={bookingLoading}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
              
              <input
                type="tel"
                placeholder="Phone Number *"
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
                    <span>${selected.price} × {rentalDays} day{rentalDays > 1 ? 's' : ''}</span>
                    <span>${selected.price * rentalDays}</span>
                  </div>
                  <div className="price-total">
                    <strong>Total</strong>
                    <strong>${calculateTotal()}</strong>
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
                {bookingLoading ? "Booking..." : `Confirm Booking - $${calculateTotal()}`}
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