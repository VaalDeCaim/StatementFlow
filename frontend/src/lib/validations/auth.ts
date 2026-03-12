import { z } from "zod";

const label = {
  name: "Full name",
  email: "Email",
  password: "Password",
  confirmPassword: "Confirm password",
  terms: "Terms",
};

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(1, `${label.name} is required`)
      .min(2, `${label.name} must be at least 2 characters`),
    email: z
      .string()
      .min(1, `${label.email} is required`)
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(1, `${label.password} is required`)
      .min(8, `${label.password} must be at least 8 characters`),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    terms: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.terms === true, {
    message: "You must agree to the terms",
    path: ["terms"],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, `${label.email} is required`)
    .email("Please enter a valid email address"),
  password: z.string().min(1, `${label.password} is required`),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, `${label.email} is required`)
    .email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, `${label.password} is required`)
      .min(8, `${label.password} must be at least 8 characters`),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
