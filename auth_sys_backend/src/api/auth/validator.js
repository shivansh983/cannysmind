const { z } = require('zod');

const authSchema = z.object({
  name: z.string().min(1, "Name is required"),
  userName: z.string().min(3),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  userName: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

module.exports = { authSchema, loginSchema };