const { z } = require('zod');

const createTaskSchema = z.object({
  name: z.string().min(3, "Task name must be at least 3 characters"),
  description: z.string().optional()
});


module.exports = { createTaskSchema };