// Placeholder help articles and FAQs (rich text as HTML) until the content API exists.
import type { HelpContent, HelpContentCategory, HelpContentStatus } from "@/types/support";

type Seed = [title: string, category: HelpContentCategory, updatedAt: string, body: string, status?: HelpContentStatus];

const toContent = (prefix: string) => (seeds: Seed[]) =>
  seeds.map(
    ([title, category, updatedAt, body, status = "published"], index): HelpContent => ({
      id: `${prefix}-${String(index + 1).padStart(3, "0")}`,
      title,
      category,
      status,
      body,
      updatedAt,
    }),
  );

export const mockHelpArticles: HelpContent[] = toContent("ART")([
  [
    "How to fund your Global Pride wallet",
    "wallet",
    "2026-09-28T10:00:00",
    "<h2>Funding your wallet</h2><p>You can fund your wallet in a few simple steps:</p><ul><li>Open the Wallet section in the app.</li><li>Tap Fund Wallet and enter the amount.</li><li>Choose your payment method and confirm.</li></ul><p>Your new balance is reflected as soon as the payment is confirmed.</p>",
  ],
  [
    "Why is my campaign still pending?",
    "campaigns",
    "2026-09-27T10:00:00",
    "<h2>Campaign processing</h2><p>Campaigns move through preparation before delivery. A campaign may briefly show as pending while it is queued.</p><ol><li>The system validates your recipient list.</li><li>The campaign is queued for delivery.</li><li>Delivery begins and progress is shown live.</li></ol><p>If a campaign stays pending for more than a few hours, contact support from the Help &amp; Support screen.</p>",
  ],
  [
    "Resetting your account password",
    "account",
    "2026-09-26T10:00:00",
    "<h2>Forgot your password?</h2><p>On the sign-in screen, tap <strong>Forgot password</strong> and enter the email on your account. We'll send a reset link that is valid for 15 minutes.</p><p>If the link has expired, request a new one.</p>",
  ],
  [
    "How audience rentals are charged",
    "audience",
    "2026-09-25T10:00:00",
    "<h2>Audience rental pricing</h2><p>Renting an audience is charged per record at the current audience rental price, plus VAT.</p><ul><li>The charge is deducted from your wallet when the campaign is sent.</li><li>Failed deliveries to rented audiences are refunded automatically.</li></ul>",
  ],
  [
    "Understanding referral rewards",
    "referrals",
    "2026-09-24T10:00:00",
    "<h2>Earning referral bonuses</h2><p>Share your referral code with friends. When someone signs up with your code and meets the qualification requirement, a bonus is credited to your wallet.</p><p>You can track each referral from <em>Profile → Referrals</em>.</p>",
  ],
  [
    "Creating your first SMS campaign",
    "campaigns",
    "2026-09-23T10:00:00",
    "<h2>Send your first campaign</h2><ol><li>Tap <strong>New Campaign</strong> and choose SMS.</li><li>Write your message and pick a sender name.</li><li>Upload recipients or rent an audience.</li><li>Review the cost and send or schedule.</li></ol>",
  ],
  [
    "How to export a purchased audience list",
    "audience",
    "2026-09-22T10:00:00",
    "<h2>Exporting audiences</h2><p>Open the audience under <em>My Audiences</em> and tap <strong>Export CSV</strong>. Contacts who have opted out are excluded from exports.</p>",
  ],
  [
    "Keeping your account secure",
    "account",
    "2026-09-20T10:00:00",
    "<h2>Security tips</h2><ul><li>Use a strong password you don't use elsewhere.</li><li>Never share one-time codes with anyone, including support staff.</li><li>Sign out of devices you no longer use.</li></ul>",
  ],
  [
    "What to do when a payment is pending",
    "wallet",
    "2026-09-19T10:00:00",
    "<h2>Pending payments</h2><p>Bank transfers can take a few minutes to confirm. Your wallet updates automatically once the payment provider confirms the payment.</p><p>If a payment is pending for more than 24 hours, contact support with your payment reference.</p>",
  ],
  [
    "Getting started with Global Pride",
    "general",
    "2026-09-18T10:00:00",
    "<h2>Welcome to Global Pride</h2><p>Global Pride helps businesses reach customers with SMS and image campaigns.</p><ol><li>Fund your wallet.</li><li>Create your first campaign.</li><li>Track delivery in real time.</li></ol>",
  ],
  [
    "Scheduling campaigns for later",
    "campaigns",
    "2026-09-16T10:00:00",
    "<h2>Scheduled campaigns</h2><p>Choose <strong>Schedule</strong> on the review screen and pick a date and time. The cost is deducted when the campaign is sent.</p>",
  ],
  [
    "Understanding VAT on your charges",
    "wallet",
    "2026-09-15T10:00:00",
    "<h2>VAT</h2><p>All service charges include VAT at the current rate. Your transaction history shows the VAT amount for each charge.</p>",
    "unpublished",
  ],
]);

export const mockFaqs: HelpContent[] = toContent("FAQ")([
  [
    "How do I fund my wallet?",
    "wallet",
    "2026-09-28T10:00:00",
    "<p>Open the Wallet section, tap Fund Wallet, enter the amount, choose a payment method and confirm. Your balance updates once the payment is confirmed.</p>",
  ],
  [
    "Why is my campaign still pending?",
    "campaigns",
    "2026-09-27T10:00:00",
    "<p>Campaigns are validated and queued before delivery starts, so they may show as pending for a few minutes. If it stays pending for hours, contact support.</p>",
  ],
  [
    "How do I reset my password?",
    "account",
    "2026-09-26T10:00:00",
    "<p>Tap <strong>Forgot password</strong> on the sign-in screen and follow the link we email you. The link is valid for 15 minutes.</p>",
  ],
  [
    "How are audience rentals charged?",
    "audience",
    "2026-09-25T10:00:00",
    "<p>Audience rentals are charged per record at the current rental price plus VAT, deducted from your wallet when the campaign is sent.</p>",
  ],
  [
    "When will I receive my referral bonus?",
    "referrals",
    "2026-09-24T10:00:00",
    "<p>Your bonus is credited to your wallet as soon as the person you referred meets the qualification requirement.</p>",
  ],
  [
    "How do I export an audience list?",
    "audience",
    "2026-09-23T10:00:00",
    "<p>Open the audience under My Audiences and tap <strong>Export CSV</strong>.</p>",
  ],
  [
    "How long does a payment take to confirm?",
    "wallet",
    "2026-09-22T10:00:00",
    "<p>Card payments confirm instantly. Bank transfers usually confirm within a few minutes, and occasionally up to 24 hours.</p>",
  ],
  [
    "Can I schedule a campaign for later?",
    "campaigns",
    "2026-09-21T10:00:00",
    "<p>Yes. Choose <strong>Schedule</strong> on the review screen and pick a date and time.</p>",
  ],
  [
    "How do I keep my account secure?",
    "account",
    "2026-09-20T10:00:00",
    "<ul><li>Use a strong, unique password.</li><li>Never share one-time codes.</li><li>Sign out of devices you no longer use.</li></ul>",
  ],
  [
    "How do I contact support?",
    "general",
    "2026-09-19T10:00:00",
    "<p>Open <em>Profile → Help &amp; Support</em> and tap <strong>Contact Support</strong> to create a ticket. We reply within one business day.</p>",
  ],
  [
    "Can I change my sender name?",
    "campaigns",
    "2026-09-18T10:00:00",
    "<p>Sender names must be approved. Submit a new sender name from Settings → Sender Names; approval usually takes one business day.</p>",
  ],
  [
    "Is my wallet balance refundable?",
    "wallet",
    "2026-09-17T10:00:00",
    "<p>Wallet balances can be used for any service on Global Pride. Contact support to request a withdrawal of unused funds.</p>",
  ],
  [
    "What happens to failed deliveries?",
    "campaigns",
    "2026-09-16T10:00:00",
    "<p>Charges for messages that fail to deliver are refunded to your wallet automatically.</p>",
    "unpublished",
  ],
]);
