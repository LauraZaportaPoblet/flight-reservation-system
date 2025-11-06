import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../config';
import { useAuth } from '../contexts/AuthContext';

function FlightCard({ flight, onBook }) {
  return (
    <div className="card bg-base-100 shadow-xl border border-base-200 hover:shadow-2xl transition-shadow">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h2 className="card-title text-primary text-2xl">{flight.Flight_Number}</h2>
          <div className="badge badge-accent badge-lg">{flight.Seats_Left} seats left</div>
        </div>
        <p className="text-sm opacity-70 font-semibold">{flight.Airline}</p>
        <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-base-200 rounded-lg">
          <div>
            <div className="font-semibold text-primary">From</div>
            <div className="text-lg font-bold">{flight.Departure}</div>
          </div>
          <div>
            <div className="font-semibold text-primary">To</div>
            <div className="text-lg font-bold">{flight.Arrival}</div>
          </div>
        </div>
        <div className="mt-2 text-sm flex items-center gap-2">
          <span>📅</span>
          <span className="font-semibold">{flight.Date}</span>
          <span className="mx-2">•</span>
          <span>🕐</span>
          <span className="font-semibold">{flight.Time}</span>
        </div>
        <div className="card-actions justify-between items-center mt-4">
          <div className="text-2xl font-bold text-primary">₹ {Number(flight.Base_Fare).toLocaleString()}</div>
          <button className="btn btn-primary" onClick={() => onBook(flight)}>Book Now</button>
        </div>
      </div>
    </div>
  );
}

function BookingModal({ open, flight, onClose, onBooked, user, getToken }) {
  const [seat, setSeat] = useState('12A')
  const [klass, setKlass] = useState('ECONOMY')
  const [mode, setMode] = useState('CARD')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setSeat('12A');
      setKlass('ECONOMY');
      setMode('CARD');
    }
  }, [open])

  const book = async () => {
    if (!flight || !user) return
    setLoading(true)
    try {
      const token = getToken();
      const rRes = await fetch(`${API_BASE}/api/reservations/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          passengerId: user.Passenger_ID,
          flightId: flight.Flight_ID,
          seatNo: seat,
          travelClass: klass,
          amount: flight.Base_Fare,
          mode,
        })
      })
      const booking = await rRes.json()
      if (!rRes.ok) throw new Error(booking.message || 'Booking failed')
      onBooked(booking)
      onClose()
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!open || !flight) return null;

  return (
    <dialog className={`modal ${open ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-2xl mb-4">Book Flight {flight.Flight_Number}</h3>
        <div className="bg-base-200 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm opacity-70">From</div>
              <div className="font-bold">{flight.Departure}</div>
            </div>
            <div>
              <div className="text-sm opacity-70">To</div>
              <div className="font-bold">{flight.Arrival}</div>
            </div>
            <div>
              <div className="text-sm opacity-70">Date</div>
              <div className="font-bold">{flight.Date}</div>
            </div>
            <div>
              <div className="text-sm opacity-70">Time</div>
              <div className="font-bold">{flight.Time}</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Seat Number</span>
            </label>
            <input
              className="input input-bordered"
              placeholder="e.g. 12A"
              value={seat}
              onChange={e => setSeat(e.target.value.toUpperCase())}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Class</span>
            </label>
            <select className="select select-bordered" value={klass} onChange={e => setKlass(e.target.value)}>
              <option>ECONOMY</option>
              <option>BUSINESS</option>
              <option>FIRST</option>
            </select>
          </div>
          <div className="form-control md:col-span-2">
            <label className="label">
              <span className="label-text font-semibold">Payment Mode</span>
            </label>
            <select className="select select-bordered" value={mode} onChange={e => setMode(e.target.value)}>
              <option>CARD</option>
              <option>UPI</option>
              <option>CASH</option>
              <option>WALLET</option>
            </select>
          </div>
        </div>
        <div className="alert alert-info mt-4">
          <span className="font-bold">Total: ₹ {Number(flight.Base_Fare).toLocaleString()}</span>
        </div>
        <div className="modal-action">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className={`btn btn-primary ${loading ? 'loading' : ''}`} onClick={book}>
            Confirm & Pay
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default function Flights() {
  const { user, getToken } = useAuth();
  const [flights, setFlights] = useState([])
  const [q, setQ] = useState({ source: '', destination: '', date: '' })
  const [chosen, setChosen] = useState(null)
  const [banner, setBanner] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams()
      if (q.source) params.append('source', q.source)
      if (q.destination) params.append('destination', q.destination)
      if (q.date) params.append('date', q.date)
      const res = await fetch(`${API_BASE}/api/flights?${params.toString()}`)
      setFlights(await res.json())
    } catch (e) {
      console.error('Failed to load flights:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load() }, [])

  const onBooked = (info) => {
    setBanner(`✅ Reservation #${info.Reservation_ID} • Ticket #${info.Ticket_ID} created successfully!`)
    load()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Search Flights</h1>
        <p className="text-gray-600">Find and book your next flight</p>
      </div>

      {banner && (
        <div className="alert alert-success mb-6 animate-fade-in">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{banner}</span>
          <button className="btn btn-sm" onClick={() => setBanner(null)}>Close</button>
        </div>
      )}

      <div className="card bg-base-200 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title mb-4">Search Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              className="input input-bordered input-primary"
              placeholder="Source city"
              value={q.source}
              onChange={e => setQ(s => ({ ...s, source: e.target.value }))}
            />
            <input
              className="input input-bordered input-primary"
              placeholder="Destination city"
              value={q.destination}
              onChange={e => setQ(s => ({ ...s, destination: e.target.value }))}
            />
            <input
              className="input input-bordered input-primary"
              type="date"
              value={q.date}
              onChange={e => setQ(s => ({ ...s, date: e.target.value }))}
            />
            <button className="btn btn-primary" onClick={load} disabled={loading}>
              {loading ? <span className="loading loading-spinner"></span> : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {loading && flights.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : flights.length === 0 ? (
        <div className="text-center py-12 bg-base-200 rounded-lg">
          <div className="text-6xl mb-4">✈️</div>
          <p className="text-xl opacity-70">No flights found. Try different filters.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {flights.map(f => (
            <FlightCard key={f.Flight_ID} flight={f} onBook={setChosen} />
          ))}
        </div>
      )}

      <BookingModal
        open={!!chosen}
        flight={chosen}
        onClose={() => setChosen(null)}
        onBooked={onBooked}
        user={user}
        getToken={getToken}
      />
    </div>
  );
}

