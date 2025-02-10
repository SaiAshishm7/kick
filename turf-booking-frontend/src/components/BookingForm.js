import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    Alert,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';

const BookingForm = ({ turfId }) => {
    const navigate = useNavigate();
    const [date, setDate] = useState(null);
    const [time, setTime] = useState(null);
    const [duration, setDuration] = useState(1);
    const [sport, setSport] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!date || !time || !sport) {
            setError('Please fill in all required fields');
            return;
        }

        const bookingDateTime = dayjs(date)
            .hour(time.hour())
            .minute(time.minute())
            .toISOString();

        try {
            const response = await axios.post('http://localhost:5001/api/bookings', {
                turfId,
                date: bookingDateTime,
                duration,
                sport,
            });

            setSuccess(true);
            setTimeout(() => {
                navigate('/bookings');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Error creating booking');
        }
    };

    return (
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4, p: 2, boxShadow: 2, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom>
                Book Turf
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    Booking successful! Redirecting to bookings page...
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        label="Date"
                        value={date}
                        onChange={(newValue) => setDate(newValue)}
                        renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
                        minDate={dayjs()}
                        sx={{ width: '100%', mb: 2 }}
                    />

                    <TimePicker
                        label="Time"
                        value={time}
                        onChange={(newValue) => setTime(newValue)}
                        renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
                        sx={{ width: '100%', mb: 2 }}
                    />
                </LocalizationProvider>

                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Duration (hours)</InputLabel>
                    <Select
                        value={duration}
                        label="Duration (hours)"
                        onChange={(e) => setDuration(e.target.value)}
                    >
                        {[1, 2, 3, 4].map((hour) => (
                            <MenuItem key={hour} value={hour}>
                                {hour} {hour === 1 ? 'hour' : 'hours'}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Sport</InputLabel>
                    <Select
                        value={sport}
                        label="Sport"
                        onChange={(e) => setSport(e.target.value)}
                    >
                        <MenuItem value="football">Football</MenuItem>
                        <MenuItem value="cricket">Cricket</MenuItem>
                        <MenuItem value="basketball">Basketball</MenuItem>
                    </Select>
                </FormControl>

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={success}
                >
                    Book Now
                </Button>
            </form>
        </Box>
    );
};

export default BookingForm;
