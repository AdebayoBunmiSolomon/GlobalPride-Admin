import * as yup from "yup";

import type { HelpContentStatus } from "@/api/types/response";
import { isEmptyRichText } from "@/utils/richText";

/** Help article / FAQ form. Messages differ per kind ("Question is required." vs "Article title is required."). */
export const makeHelpContentSchema = (messages: { titleRequired: string; bodyRequired: string }) =>
  yup.object({
    title: yup.string().trim().required(messages.titleRequired).max(160, "Keep this under 160 characters."),
    category: yup.string().trim().required("Please select a category."),
    /** Articles only; shown under the title in the app's article list. */
    summary: yup.string().trim().max(300, "Keep the summary under 300 characters.").default(""),
    status: yup.mixed<HelpContentStatus>().oneOf(["published", "draft"]).required(),
    body: yup
      .string()
      .required(messages.bodyRequired)
      .test("not-empty", messages.bodyRequired, (value) => !isEmptyRichText(value ?? "")),
  });

export type HelpContentValues = yup.InferType<ReturnType<typeof makeHelpContentSchema>>;
