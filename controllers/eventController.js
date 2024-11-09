const Event = require('../models/Event');

exports.createEvent = async (req, res) => {
    const { title, date, time, location, photographer_id } = req.body;
    try {
        const event = new Event({ title, date, time, location, photographer_id });
        await event.save();
        res.status(201).json({ message: 'Event created successfully', event });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getEventsByPhotographer = async (req, res) => {
    const photographerId = req.userId;
    try {
        const events = await Event.find({ photographer_id: photographerId });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
