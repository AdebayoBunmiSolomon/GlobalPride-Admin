import * as yup from "yup";

import type { HelpContentCategory, HelpContentStatus } from "@/types/support";
import { isEmptyRichText } from "@/utils/richText";

const categories: HelpContentCategory[] = ["account", "wallet", "campaigns", "audience", "referrals", "general"];

/** Help article / FAQ form. Messages differ per kind ("Question is required." vs "Article title is required."). */
export const makeHelpContentSchema = (messages: { titleRequired: string; bodyRequired: string }) =>
  yup.object({
    title: yup.string().trim().required(messages.titleRequired).max(160, "Keep this under 160 characters."),
    category: yup
      .mixed<HelpContentCategory>()
      .oneOf(categories, "Please select a category.")
      .required("Please select a category."),
    status: yup.mixed<HelpContentStatus>().oneOf(["published", "unpublished"]).required(),
    body: yup
      .string()
      .required(messages.bodyRequired)
      .test("not-empty", messages.bodyRequired, (value) => !isEmptyRichText(value ?? "")),
  });

export type HelpContentValues = yup.InferType<ReturnType<typeof makeHelpContentSchema>>;
