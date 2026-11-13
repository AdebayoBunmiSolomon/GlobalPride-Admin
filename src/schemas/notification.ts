import * as yup from "yup";

export const NOTIFICATION_TITLE_MAX = 100;
export const NOTIFICATION_MESSAGE_MAX = 500;

export type DeliveryMode = "now" | "later";

/** Admin announcement form. Date and time are only required when scheduling for later. */
export const announcementSchema = yup.object({
  title: yup
    .string()
    .trim()
    .required("Notification title is required.")
    .max(NOTIFICATION_TITLE_MAX, `Title must be ${NOTIFICATION_TITLE_MAX} characters or fewer.`),
  message: yup
    .string()
    .trim()
    .required("Message is required.")
    .max(NOTIFICATION_MESSAGE_MAX, `Message must be ${NOTIFICATION_MESSAGE_MAX} characters or fewer.`),
  delivery: yup.mixed<DeliveryMode>().oneOf(["now", "later"]).required(),
  scheduleDate: yup
    .string()
    .default("")
    .when("delivery", {
      is: "later",
      then: (schema) =>
        schema
          .required("Please choose a date.")
          .test("in-future", "The scheduled time must be in the future.", function (date) {
            const { scheduleTime } = this.parent as { scheduleTime?: string };
            if (!date || !scheduleTime) return true;
            return new Date(`${date}T${scheduleTime}`).getTime() > Date.now();
          }),
    }),
  scheduleTime: yup
    .string()
    .default("")
    .when("delivery", { is: "later", then: (schema) => schema.required("Please choose a time.") }),
});

export type AnnouncementValues = yup.InferType<typeof announcementSchema>;
