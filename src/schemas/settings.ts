import * as yup from "yup";

export const PLATFORM_NAME_MAX = 80;
export const PLATFORM_DESCRIPTION_MAX = 240;

// Digits, spaces, dashes and brackets with an optional leading "+", 7–15 digits in total.
const isPhone = (value?: string) =>
  !value || (/^\+?[\d\s()-]+$/.test(value) && /^\d{7,15}$/.test(value.replace(/\D/g, "")));

export const generalSettingsSchema = yup.object({
  platformName: yup
    .string()
    .trim()
    .required("Platform name is required.")
    .max(PLATFORM_NAME_MAX, `Platform name must be ${PLATFORM_NAME_MAX} characters or fewer.`),
  description: yup
    .string()
    .trim()
    .max(PLATFORM_DESCRIPTION_MAX, `Description must be ${PLATFORM_DESCRIPTION_MAX} characters or fewer.`)
    .default(""),
  supportEmail: yup.string().trim().email("Enter a valid email address.").default(""),
  supportPhone: yup.string().trim().test("phone", "Enter a valid phone number, e.g. +234 800 000 0000.", isPhone).default(""),
  logo: yup.string().default(""),
  timeZone: yup.string().required("Please choose a time zone."),
});

export type GeneralSettingsValues = yup.InferType<typeof generalSettingsSchema>;
