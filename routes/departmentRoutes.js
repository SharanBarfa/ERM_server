import express from 'express';
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
} from '../controllers/departmentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, admin, createDepartment)
  .get(getDepartments);

router.route('/:id')
  .get(getDepartmentById)
  .put(protect, admin, updateDepartment)
  .delete(protect, admin, deleteDepartment);

export default router;
