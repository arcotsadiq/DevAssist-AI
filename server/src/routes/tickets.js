import { Router } from 'express';
import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== 'All') filter.status = req.query.status;
    if (req.query.q) {
      const q = String(req.query.q).slice(0, 100);
      filter.$or = [{ title: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }];
    }
    const tickets = await Ticket.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json(tickets);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, description, requester } = req.body;
    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }
    const ticket = await Ticket.create({ title, description, requester });
    res.status(201).json(ticket);
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ticket ID.' });
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    res.json(ticket);
  } catch (error) { next(error); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ticket ID.' });
    const allowed = ['Open', 'In Progress', 'Resolved'];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Invalid status.' });
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    res.json(ticket);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ticket ID.' });
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
    res.json({ message: 'Ticket deleted.' });
  } catch (error) { next(error); }
});

export default router;
