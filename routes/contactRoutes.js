import express from 'express';
import { createContact, getContacts, updateContactStatus } from '../controllers/contactController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(createContact)
  .get(protect, admin, getContacts);

router.route('/:id')
  .put(protect, admin, updateContactStatus);

export default router;