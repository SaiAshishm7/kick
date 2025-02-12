import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const TurfDetails = () => {
  const { turfId } = useParams();
  const [turf, setTurf] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTurfDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/turfs/${turfId}`);
        setTurf(response.data);
      } catch (error) {
        console.error('Error fetching turf details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTurfDetails();
  }, [turfId]);

  if (loading) return <p>Loading...</p>;
  if (!turf) return <p>Turf not found.</p>;

  return (
    <div>
      <h2>{turf.name}</h2>
      <p>Location: {turf.location}</p>
      <p>Price per hour: ₹{turf.hourlyPrice}</p>
      <p>Available Sports: {turf.sports.join(', ')}</p>

      {/* Display Turf Images */}
      <div>
        {turf.photos.map((photo, index) => (
          <img key={index} src={`http://localhost:5001/${photo}`} alt={`Turf ${index}`} style={{ width: '200px', margin: '10px' }} />
        ))}
      </div>

      {/* Add booking and reviews here later */}
    </div>
  );
};

export default TurfDetails;
