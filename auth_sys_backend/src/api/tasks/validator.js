const { z } = require('zod');

const createTaskSchema = z.object({
  name: z.string().min(3, "Task name must be at least 3 characters"),
  description: z.string().optional(),
  approverId: z.string().uuid("Invalid approver ID format").optional()
});

const approveTaskSchema = z.object({
  isActive: z.boolean()
});

module.exports = { createTaskSchema, approveTaskSchema };