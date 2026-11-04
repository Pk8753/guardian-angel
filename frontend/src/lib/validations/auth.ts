import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  secondName: z.string().min(1, 'Second name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  dob: z.string().min(1, 'Date of birth is required'),
  email: z.string().email('Please enter a valid email address'),
  location: z.string().min(1, 'Location is required'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  otp: z.string().optional().default('9090'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

