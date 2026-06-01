const { z } = require('zod');

const prioritySchema = z.preprocess(
  value => (typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : undefined),
  z.enum(['low', 'medium', 'high', 'critical']).optional()
);

const deadlineSchema = z.preprocess(
  value => (value === '' ? null : value),
  z.union([z.coerce.date(), z.null()]).optional()
);

const createTaskSchema = z.object({
  name: z.string().trim().min(3, "Task name must be at least 3 characters"),
  description: z.string().trim().optional(),
  deadline: deadlineSchema,
  priority: prioritySchema
});

const updateTaskSchema = z.object({
  name: z.string().trim().min(3, "Task name must be at least 3 characters").optional(),
  description: z.string().trim().nullable().optional(),
  deadline: deadlineSchema,
  priority: prioritySchema
});

module.exports = { createTaskSchema, updateTaskSchema };
