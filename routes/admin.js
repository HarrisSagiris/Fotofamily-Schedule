const express = require('express');
const Photographer = require('../models/Photographer');
const Event = require('../models/Event');
const Assignment = require('../models/Assignment');

const router = express.Router();

router.get('/', async (req, res) => {
    const photographers = await Photographer.find();
    const events = await Event.find();
    const assignments = await Assignment.find().populate('photographer').populate('event');

    const assignmentsData = assignments.map(a => ({
        photographer: a.photographer.name,
        event: a.event.name,
        location: a.event.location,
        date: a.event.date,
        printer: a.event.printer,
    }));

    const photographerNames = photographers.map(p => p.name);

    res.render('admin', { assignmentsData, photographerNames });
});

router.post('/save-assignments', async (req, res) => {
    const assignmentsData = req.body.data;

    for (const row of assignmentsData) {
        const photographer = await Photographer.findOne({ name: row[0] });
        const event = await Event.findOne({ name: row[1] });

        if (photographer && event) {
            await Assignment.updateOne(
                { photographer: photographer._id, event: event._id },
                { $set: { photographer: photographer._id, event: event._id }},
                { upsert: true }
            );
        }
    }
    res.json({ message: 'Assignments updated successfully' });
});

module.exports = router;
