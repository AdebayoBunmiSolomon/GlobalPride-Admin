export type Tone = "purple" | "blue" | "green" | "gray" | "red" | "amber";

/** Icon tile + accent text colors for status-coloured list items. */
export const toneStyles: Record<Tone, { icon: string; text: string }> = {
  purple: { icon: "bg-primary/10 text-primary", text: "text-primary" },
  blue: { icon: "bg-blue-50 text-blue-600", text: "text-blue-600" },
  green: { icon: "bg-green-50 text-green-600", text: "text-green-700" },
  gray: { icon: "bg-gray-100 text-gray-600", text: "text-gray-700" },
  red: { icon: "bg-red-50 text-red-600", text: "text-red-600" },
  amber: { icon: "bg-amber-50 text-amber-600", text: "text-amber-700" },
};
