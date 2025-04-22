import { z } from "zod";

export const userSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().min(1, "Email is required."),
  password: z
    .string()
    .min(1, "Password is required.")
    .regex(/^[a-zA-Z0-9]+$/, "Password must contain only letters and numbers.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/\d/, "Password must contain at least one number.")
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character."
    ),
  groups: z.array(z.string()).min(1, "At least one role is required."),
});
