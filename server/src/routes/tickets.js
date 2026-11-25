
import { Router } from 'express';
import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';

const router = Router();

const ALLOWED_STATUSES = ['Open', 'In Progress', 'Resolved'];

// Escape special regex characters in search input.
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET: Fetch and search tickets
router.get('/', async (req, res, next) => {
  try {
    const filter = {};

    const status = req.query.status;

    if (status && status !== 'All') {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          message: 'Invalid ticket status filter.'
        });
      }

      filter.status = status;
    }

    if (req.query.q) {
      const q = String(req.query.q).trim().slice(0, 100);

      if (q) {
        const safeQuery = escapeRegex(q);

        filter.$or = [
          { title: { $regex: safeQuery, $options: 'i' } },
          { description: { $regex: safeQuery, $options: 'i' } }
        ];
      }
    }

    const tickets = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json(tickets);

  } catch (error) {
    next(error);
  }
});

// POST: Create a new ticket
router.post('/', async (req, res, next) => {
  try {
    const { title, description, requester } = req.body || {};

    if (
      typeof title !== 'string' ||
      typeof description !== 'string' ||
      !title.trim() ||
      !description.trim()
    ) {
      return res.status(400).json({
        message: 'Valid title and description are required.'
      });
    }

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const cleanRequester =
      typeof requester === 'string' && requester.trim()
        ? requester.trim()
        : 'Demo user';

    if (cleanTitle.length > 120) {
      return res.status(400).json({
        message: 'Title cannot exceed 120 characters.'
      });
    }

    if (cleanDescription.length > 5000) {
      return res.status(400).json({
        message: 'Description cannot exceed 5000 characters.'
      });
    }

    if (cleanRequester.length > 100) {
      return res.status(400).json({
        message: 'Requester cannot exceed 100 characters.'
      });
    }

    const ticket = await Ticket.create({
      title: cleanTitle,
      description: cleanDescription,
      requester: cleanRequester
    });

    return res.status(201).json(ticket);

  } catch (error) {
    next(error);
  }
});

// GET: Fetch a single ticket
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: 'Invalid ticket ID.'
      });
    }

    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        message: 'Ticket not found.'
      });
    }

    return res.json(ticket);

  } catch (error) {
    next(error);
  }
});

// PATCH: Update ticket status
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: 'Invalid ticket ID.'
      });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status.'
      });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      { $set: { status } },
      {
        new: true,
        runValidators: true
      }
    );

    if (!ticket) {
      return res.status(404).json({
        message: 'Ticket not found.'
      });
    }

    return res.json(ticket);

  } catch (error) {
    next(error);
  }
});

// DELETE: Delete a ticket
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: 'Invalid ticket ID.'
      });
    }

    const ticket = await Ticket.findByIdAndDelete(id);

    if (!ticket) {
      return res.status(404).json({
        message: 'Ticket not found.'
      });
    }

    return res.json({
      message: 'Ticket deleted.',
      id: ticket._id
    });

  } catch (error) {
    next(error);
  }
});

export default router;
