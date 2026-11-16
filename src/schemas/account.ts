import * as yup from "yup";

/** The API\'s "strong password" rule: upper case, lower case, a number and a special character. */
export const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

/**
 * Pass `context: { requireStrongPasswords }` to the resolver (Settings → Security).
 * Strong: 8+ characters with uppercase, lowercase, a number and a special character. Otherwise 8+ characters.
 */
export const changePasswordSchema = yup.object({
  current: yup.string().required("Enter your current password."),
  next: yup
    .string()
    .required("Enter a new password.")
    .min(8, "Password must be at least 8 characters.")
    .test("strong", "Password does not meet the requirements.", function (value) {
      return this.options.context?.requireStrongPasswords === false || !value || passwordRule.test(value);
    }),
  confirm: yup
    .string()
    .required("Confirm your new password.")
    .oneOf([yup.ref("next")], "Passwords do not match."),
});

export type ChangePasswordValues = yup.InferType<typeof changePasswordSchema>;

export const profileSchema = yup.object({
  name: yup.string().trim().required("Enter your full name."),
  email: yup
    .string()
    .trim()
    .required("Enter your email address.")
    .email("Enter a valid email address."),
});

export type ProfileValues = yup.InferType<typeof profileSchema>;

export const loginSchema = yup.object({
  email: yup.string().trim().required("Enter your email address.").email("Enter a valid email address."),
  password: yup.string().required("Enter your password."),
});

export type LoginValues = yup.InferType<typeof loginSchema>;
