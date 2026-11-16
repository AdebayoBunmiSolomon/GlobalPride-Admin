import * as yup from "yup";

const isHttpUrl = (value?: string) => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.includes(".");
  } catch {
    return false;
  }
};

type ScheduleFields = { startDate?: string; startTime?: string; endDate?: string; endTime?: string };

const toTime = (date?: string, time?: string) => (date && time ? new Date(`${date}T${time}`).getTime() : NaN);

/**
 * Pass `context: { requireFutureEnd: true }` to the resolver when creating an
 * ad, so it can't be published with a schedule that has already finished.
 */
export const advertisementSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("Please enter an advertisement name.")
    .max(80, "Advertisement name must be 80 characters or fewer."),
  advertiser: yup
    .string()
    .trim()
    .required("Please enter the advertiser or business name.")
    .max(80, "Advertiser name must be 80 characters or fewer."),
  description: yup.string().trim().max(280, "Short description must be 280 characters or fewer.").default(""),
  /** Preview URL of the creative; the file itself is sent separately. */
  creative: yup.string().required("Please upload a creative image."),
  ctaLabel: yup
    .string()
    .trim()
    .required("Please enter a CTA label.")
    .max(20, "CTA label must be 20 characters or fewer."),
  destinationUrl: yup
    .string()
    .trim()
    .required("Please enter a destination URL.")
    .test("http-url", "Enter a valid URL starting with http:// or https://.", isHttpUrl),
  placement: yup.string().oneOf(["home_feed"], "Please choose a placement.").required("Please choose a placement."),
  startDate: yup.string().required("Please choose a start date."),
  startTime: yup.string().required("Please choose a start time."),
  endDate: yup
    .string()
    .required("Please choose an end date.")
    .test("after-start", "The end date and time must be after the start.", function () {
      const { startDate, startTime, endDate, endTime } = this.parent as ScheduleFields;
      const start = toTime(startDate, startTime);
      const end = toTime(endDate, endTime);
      return Number.isNaN(start) || Number.isNaN(end) || end > start;
    })
    .test("in-future", "The end date and time must be in the future.", function () {
      const { endDate, endTime } = this.parent as ScheduleFields;
      const end = toTime(endDate, endTime);
      return !this.options.context?.requireFutureEnd || Number.isNaN(end) || end > Date.now();
    }),
  endTime: yup.string().required("Please choose an end time."),
});

export type AdvertisementValues = yup.InferType<typeof advertisementSchema>;
