const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const EventEmitter = require('events');
const protectRoute = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

// In-process event emitter for streaming notifications to connected clients
const notificationEmitter = new EventEmitter();
notificationEmitter.setMaxListeners(1000);

// export the emitter so other modules can listen if needed
module.exports.notificationEmitter = notificationEmitter;

// Fetch notifications for the authenticated user in reverse chronological order
router.get('/', protectRoute, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.json(notifications);
  } catch (error) {
    console.error('GET /api/notifications error', error);
    return res.status(500).json({ msg: 'Failed to load notifications' });
  }
});

// Mark a notification as read, only if it belongs to the authenticated user
router.put('/:id/read', protectRoute, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'Invalid notification id' });
  }

  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    return res.json(notification);
  } catch (error) {
    console.error('PUT /api/notifications/:id/read error', error);
    return res.status(500).json({ msg: 'Failed to mark notification as read' });
  }
});

// Temporary test trigger route for manual verification using Postman
router.post('/test-trigger', protectRoute, async (req, res) => {
  const { title, message, type = 'system_log', metadata = {} } = req.body;

  if (!title || !message) {
    return res.status(400).json({ msg: 'Title and message are required' });
  }

  try {
    const notification = await Notification.create({
      userId: req.userId,
      title,
      message,
      type,
      metadata,
    });

    return res.status(201).json(notification);
  } catch (error) {
    console.error('POST /api/notifications/test-trigger error', error);
    return res.status(500).json({ msg: 'Failed to create test notification' });
  }
});

async function createSystemNotification(userId, title, message, type = 'ai_complete', metadata = {}) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid userId');
  }

  const sanitizedType = String(type || 'ai_complete').toLowerCase().trim().replace(/-/g, '_');

  const created = await Notification.create({
    userId,
    title,
    message,
    type: sanitizedType,
    metadata,
  });

  // Emit event for SSE/Web clients
  try {
    notificationEmitter.emit('new', created);
  } catch (emitErr) {
    console.error('notificationEmitter emit failed:', emitErr.message);
  }

  return created;
}

// Server-Sent Events stream for live notifications
// Clients may connect with a token query param: /api/notifications/stream?token=XXX
router.get('/stream', async (req, res) => {
  try {
    const token = String(req.query.token || '').replace('Bearer ', '') || null;
    if (!token) return res.status(401).json({ msg: 'Missing token for SSE stream' });

    let decoded = null;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch (err) {
      return res.status(401).json({ msg: 'Invalid token for SSE stream' });
    }

    const userId = decoded?.user?.id || decoded?.id || decoded?._id;
    if (!userId) return res.status(401).json({ msg: 'Invalid token payload' });

    // set headers for SSE
    res.writeHead(200, {
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
    });

    // helper to send an event
    const sendEvent = (payload) => {
      try {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (err) {
        // ignore
      }
    };

    // send a ping to establish connection
    res.write(`event: ping\ndata: connected\n\n`);

    const onNew = (notification) => {
      if (!notification) return;
      const nid = String(notification.userId || notification.user || '');
      if (nid === String(userId)) {
        sendEvent({ type: 'notification', notification });
      }
    };

    notificationEmitter.on('new', onNew);

    // remove listener on client disconnect
    req.on('close', () => {
      notificationEmitter.removeListener('new', onNew);
    });
  } catch (err) {
    console.error('SSE /stream error:', err.message);
    try {
      res.status(500).end();
    } catch (e) {}
  }
});

module.exports = router;
module.exports.createSystemNotification = createSystemNotification;
