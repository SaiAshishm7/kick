const mongoose = require('mongoose');
const Turf = require('../models/Turf');

mongoose.connect('mongodb://localhost:27017/kickNclick', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const testTurf = new Turf({
    name: 'Test Football Ground',
    location: 'Test Location',
    hourlyPrice: 1000,
    availableSports: ['football']
});

testTurf.save()
    .then(turf => {
        console.log('Test turf added successfully:', turf);
        mongoose.connection.close();
    })
    .catch(err => {
        console.error('Error adding test turf:', err);
        mongoose.connection.close();
    });
