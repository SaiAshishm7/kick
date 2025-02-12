const express = require('express');
const router = express.Router();
const Turf = require('../models/Turf');

// Create a new Turf
router.post('/add', async (req, res) => {
    try {
        const { name, location, hourlyPrice, availableSports } = req.body;
        const turf = new Turf({ name, location, hourlyPrice, availableSports });
        await turf.save();
        res.status(201).json({ message: 'Turf added successfully', turf });
    } catch (err) {
        res.status(400).json({ message: 'Error adding turf', error: err });
    }
});


router.get('/all', async (req, res) => {
    try {
        const turfs = await Turf.find();
        console.log('Turfs being sent to frontend:', turfs);  // Add this
        res.status(200).json(turfs);
    } catch (err) {
        res.status(400).json({ message: 'Error fetching turfs', error: err });
    }
});

// Get turf by ID
router.get('/:id', async (req, res) => {
    try {
      const turf = await Turf.findById(req.params.id);
      if (!turf) return res.status(404).json({ message: 'Turf not found' });
      res.json(turf);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching turf', error });
    }
  });

// Update turf info
router.put('/:id', async (req, res) => {
    try {
        const updatedTurf = await Turf.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ message: 'Turf updated successfully', updatedTurf });
    } catch (err) {
        res.status(400).json({ message: 'Error updating turf', error: err });
    }
});

// Delete a turf
router.delete('/:id', async (req, res) => {
    try {
        const turf = await Turf.findByIdAndDelete(req.params.id);
        if (!turf) {
            return res.status(404).json({ message: 'Turf not found' });
        }
        res.status(200).json({ message: 'Turf deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: 'Error deleting turf', error: err });
    }
});

// Route to get all turfs
router.get('/', async (req, res) => {
    try {
        const turfs = await Turf.find();
        res.json(turfs);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch turfs', error: err });
    }
});

module.exports = router;
