import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem('user'));
    if (loggedInUser) {
      setUser(loggedInUser);
      axios.get(`http://localhost:5001/api/bookings/user/${loggedInUser._id}`)
        .then(response => setBookings(response.data))
        .catch(error => console.error('Error fetching bookings:', error));
    }
  }, []);

  if (!user) return <p>Please log in to view your profile.</p>;

  return (
    <div>
      <h1>{user.name}'s Profile</h1>
      <p>Email: {user.email}</p>

      <h2>Your Bookings</h2>
      {bookings.length > 0 ? bookings.map(booking => (
        <div key={booking._id}>
          <p>Turf: {booking.turf.name}</p>
          <p>Date: {booking.date}</p>
          <p>Time: {booking.startTime} - {booking.endTime}</p>
        </div>
      )) : <p>No bookings yet.</p>}
    </div>
  );
};

export default Profile;
