/** A record another item is about, shown as a "Related Information" link. */
export interface RelatedRecord {
  type: "transaction" | "campaign" | "referral";
  id: string;
}
