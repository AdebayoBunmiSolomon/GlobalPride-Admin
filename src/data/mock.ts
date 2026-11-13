// Placeholder data until the pages are wired to the API.
import {
  CalendarCheck,
  CheckCheck,
  CircleAlert,
  CircleDollarSign,
  CirclePlus,
  CircleX,
  Clock,
  CreditCard,
  Database,
  Flag,
  Gift,
  LogIn,
  Megaphone,
  MessageCircle,
  Plug,
  Send,
  User,
  UserCheck,
  UserCog,
  UserStar,
  Users,
  Wallet,
} from "lucide-react";

import { makeCreative } from "./adCreatives";
import { nigeriaLgas, toSlug } from "./nigeria";

import type {
  Campaign,
  CampaignLogEntry,
  CampaignRecipient,
  CampaignStatus,
  RecipientStatus,
} from "@/types/campaign";
import type { Advertisement } from "@/types/advertisement";
import type { AudienceLga, AudienceRecord, AudienceState, Gender } from "@/types/audience";
import type { Promotion, ReferralBonus, ServicePrice } from "@/types/pricing";
import type { PlatformNotification } from "@/types/notification";
import type { Referral } from "@/types/referral";
import type { SupportTicket, TicketMessage, TicketNote } from "@/types/support";
import type { WalletLedgerEntry, WalletTransactionType } from "@/types/wallet";
import type {
  PlatformUser,
  UserActivity,
  UserCampaign,
  WalletTransaction,
} from "@/types/user";

export const mockAdmin = {
  name: "Admin",
  email: "admin@example.com",
  role: "Administrator",
};

export const statCards = [
  { label: "Total Users", value: "24,580", trend: "+8.4%", icon: User, tone: "purple" },
  { label: "Total Revenue", value: "₦18.4M", trend: "+12.6%", icon: Wallet, tone: "purple", highlighted: true },
  { label: "Active Campaigns", value: "128", note: "34 scheduled", icon: Megaphone, tone: "blue" },
  { label: "Total Messages Sent", value: "4.82M", trend: "+15.2%", icon: MessageCircle, tone: "green" },
  { label: "Successful Referrals", value: "1,420", note: "Successful referrals", icon: UserCheck, tone: "gray" },
  { label: "Delivery Rate", value: "96.8%", note: "Across all campaigns", icon: CheckCheck, tone: "green" },
] as const;

export const attentionItems = [
  { title: "Flagged Activities", description: "User activities require review.", count: 12, action: "Review Flagged Activities", icon: Flag, tone: "purple" },
  { title: "Failed Campaigns", description: "Campaigns require review.", count: 26, action: "View Failed Campaigns", icon: CircleAlert, tone: "red" },
  { title: "Payment Issues", description: "Transactions need attention.", count: 4, action: "View Transactions", icon: CircleDollarSign, tone: "amber" },
  { title: "Audience Database", description: "Last updated 5 days ago.", action: "Update Database", icon: Database, tone: "gray" },
  { title: "API Provider", description: "Elevated SMS delivery failures.", action: "View Provider Status", icon: Plug, tone: "amber" },
] as const;

const days = ["Aug 18", "Aug 20", "Aug 22", "Aug 24", "Aug 26", "Aug 28", "Aug 30", "Sep 1", "Sep 3", "Sep 5", "Sep 7", "Sep 9", "Sep 11", "Sep 13", "Sep 16"];
const created = [5, 4, 7, 6, 8, 5, 9, 4, 6, 7, 5, 8, 6, 7, 8];
const messages = [130, 120, 150, 140, 160, 165, 205, 140, 175, 160, 150, 145, 170, 190, 215];

export const campaignPerformance = days.map((day, i) => ({
  day,
  campaigns: created[i],
  messages: messages[i] * 1000,
}));

export const revenueTrend = [
  520, 560, 540, 610, 580, 600, 570, 640, 590, 610, 600, 620, 580, 630, 610, 600, 640, 620, 650, 640, 700,
].map((value, i) => ({ day: `D${i + 1}`, revenue: value * 1000 }));

export const revenueSources = [
  { label: "SMS Campaigns", value: "₦9.2M", color: "bg-violet-500" },
  { label: "Image Campaigns", value: "₦5.5M", color: "bg-blue-500" },
  { label: "Audience Rental", value: "₦3.7M", color: "bg-green-600" },
];

export const campaignStatus = [
  { label: "Active", count: 128, color: "bg-green-600" },
  { label: "Scheduled", count: 34, color: "bg-blue-500" },
  { label: "Completed", count: 1420, color: "bg-stone-400" },
  { label: "Failed", count: 26, color: "bg-red-500" },
  { label: "Cancelled", count: 18, color: "bg-gray-300" },
];

// Platform-wide referral programme figures, shared by the dashboard and Referral Management.
export const referralProgramStats = {
  total: 1_433,
  successful: 1_420,
  pending: 13,
  bonusesPaid: 710_000,
  usersRewarded: 1_310,
};

export const referralStats = [
  { label: "Total Referrals", value: referralProgramStats.total.toLocaleString() },
  { label: "Successful Referrals", value: referralProgramStats.successful.toLocaleString() },
  { label: "Pending", value: referralProgramStats.pending.toLocaleString() },
  { label: "Bonus Credits Issued", value: `₦${referralProgramStats.bonusesPaid.toLocaleString()}` },
];

export const recentActivities = [
  { text: "John Doe created an account.", time: "5 minutes ago", icon: User, tone: "purple" },
  { text: "Summer Promotion campaign completed successfully.", time: "18 minutes ago", icon: Megaphone, tone: "green", status: { label: "Completed", variant: "success" } },
  { text: "₦50,000 added to a user wallet.", time: "32 minutes ago", icon: Wallet, tone: "blue", status: { label: "Funded", variant: "info" } },
  { text: "Campaign GP-2026-00321 failed.", time: "1 hour ago", icon: CircleAlert, tone: "red", status: { label: "Failed", variant: "danger" } },
  { text: "2,400 new audience records added.", time: "2 hours ago", icon: Database, tone: "gray" },
  { text: "₦500 referral bonus credited.", time: "3 hours ago", icon: Gift, tone: "green", status: { label: "Credited", variant: "success" } },
] as const;

// ── User management ─────────────────────────────────────────────────────────

// Referrals: [id, referrerId, referred user's name, sign-up date, bonus wallet transaction].
// A referral with a bonus transaction has qualified; the rest are still pending.
const referralSeeds: [string, string, string, string, string?][] = [
  ["REF-001830", "u-1005", "Kelechi Obi", "2026-09-06", "TXN-001265"],
  ["REF-001831", "u-1009", "Funmi Lawal", "2026-09-07"],
  ["REF-001832", "u-1001", "Musa Garba", "2026-09-08"],
  ["REF-001833", "u-1007", "Yetunde Afolabi", "2026-09-10", "TXN-001310"],
  ["REF-001834", "u-1011", "Obinna Okonkwo", "2026-09-11"],
  ["REF-001835", "u-1004", "Hauwa Ibrahim", "2026-09-14", "TXN-001271"],
  ["REF-001836", "u-1002", "Segun Ogunleye", "2026-09-15"],
  ["REF-001837", "u-1006", "Ifeoma Etim", "2026-09-16"],
  ["REF-001838", "u-1009", "Sani Danjuma", "2026-09-17"],
  ["REF-001839", "u-1003", "Kemi Bassey", "2026-09-19", "TXN-001281"],
  ["REF-001840", "u-1001", "Babatunde Olawale", "2026-09-19"],
  ["REF-001841", "u-1007", "Ada Nwosu", "2026-09-20"],
  ["REF-001842", "u-1001", "Ifeanyi Okafor", "2026-09-20", "TXN-001999"],
  ["REF-001843", "u-1010", "Bukola Adeyemi", "2026-09-21"],
  ["REF-001844", "u-1004", "Uche Abubakar", "2026-09-21"],
  ["REF-001845", "u-1006", "Halima Lawal", "2026-09-22"],
  ["REF-001846", "u-1002", "Femi Ogunleye", "2026-09-22", "TXN-001305"],
  ["REF-001847", "u-1008", "Blessing Uche", "2026-09-23"],
  ["REF-001848", "u-1004", "Abdullahi Sani", "2026-09-23", "TXN-001304"],
  ["REF-001849", "u-1011", "Chidinma Okeke", "2026-09-24", "TXN-001309"],
  ["REF-001850", "u-1006", "Tobi Adeleke", "2026-09-25", "TXN-001303"],
  ["REF-001851", "u-1012", "Zainab Yusuf", "2026-09-25"],
  ["REF-001852", "u-1005", "Chinedu Eze", "2026-09-25"],
  ["REF-001853", "u-1009", "Grace Etim", "2026-09-26"],
  ["REF-001854", "u-1002", "Daniel Bassey", "2026-09-26"],
  ["REF-001855", "u-1007", "Kemi Afolabi", "2026-09-26"],
  ["REF-001856", "u-1006", "Ibrahim Musa", "2026-09-26"],
  ["REF-001857", "u-1004", "Esther Okon", "2026-09-27"],
  ["REF-001858", "u-1003", "Victor Danjuma", "2026-09-27"],
  ["REF-001859", "u-1002", "Joy Nwachukwu", "2026-09-27"],
  ["REF-001860", "u-1001", "Peter Adeyemi", "2026-09-28"],
];

const referredUserId = (index: number) => `u-${1013 + index}`;

// Users who signed up through a referral link.
const referredUsers: PlatformUser[] = referralSeeds.map(([id, , name, joinedAt, bonusTransactionId], index) => ({
  id: referredUserId(index),
  name,
  email: `${name.toLowerCase().replace(" ", ".")}@email.com`,
  phone: `0${["803", "806", "813", "703", "905"][index % 5]} ${id.slice(-3)} ${String(4100 + index * 37).slice(-4)}`,
  campaigns: bonusTransactionId ? 1 : 0,
  walletBalance: 0,
  status: "active",
  joinedAt,
}));

export const mockUsers: PlatformUser[] = [
  { id: "u-1001", name: "John Doe", email: "john.doe@email.com", phone: "0803 123 4567", campaigns: 24, walletBalance: 42500, status: "active", joinedAt: "2026-09-12" },
  { id: "u-1002", name: "Sarah Ade", email: "sarah.ade@email.com", phone: "0806 234 5678", campaigns: 8, walletBalance: 12000, status: "active", joinedAt: "2026-09-10" },
  { id: "u-1003", name: "Michael Okoro", email: "michael.okoro@email.com", phone: "0812 345 6789", campaigns: 16, walletBalance: 0, status: "suspended", joinedAt: "2026-09-08" },
  { id: "u-1004", name: "Amaka Bello", email: "amaka.bello@email.com", phone: "0903 456 7890", campaigns: 31, walletBalance: 85400, status: "active", joinedAt: "2026-09-05" },
  { id: "u-1005", name: "David James", email: "david.james@email.com", phone: "0704 567 8901", campaigns: 4, walletBalance: 7500, status: "active", joinedAt: "2026-09-03" },
  { id: "u-1006", name: "Chioma Eze", email: "chioma.eze@email.com", phone: "0815 678 9012", campaigns: 19, walletBalance: 31200, status: "active", joinedAt: "2026-09-01" },
  { id: "u-1007", name: "Tunde Bakare", email: "tunde.bakare@email.com", phone: "0902 789 0123", campaigns: 12, walletBalance: 18750, status: "active", joinedAt: "2026-08-29" },
  { id: "u-1008", name: "Ngozi Okafor", email: "ngozi.okafor@email.com", phone: "0807 890 1234", campaigns: 7, walletBalance: 4300, status: "suspended", joinedAt: "2026-08-27" },
  { id: "u-1009", name: "Emeka Nwosu", email: "emeka.nwosu@email.com", phone: "0816 901 2345", campaigns: 22, walletBalance: 56900, status: "active", joinedAt: "2026-08-24" },
  { id: "u-1010", name: "Aisha Bello", email: "aisha.bello@email.com", phone: "0905 012 3456", campaigns: 3, walletBalance: 0, status: "active", joinedAt: "2026-08-22" },
  { id: "u-1011", name: "Femi Adeyemi", email: "femi.adeyemi@email.com", phone: "0809 123 7788", campaigns: 11, walletBalance: 22100, status: "active", joinedAt: "2026-08-19" },
  { id: "u-1012", name: "Halima Musa", email: "halima.musa@email.com", phone: "0813 456 9900", campaigns: 0, walletBalance: 1500, status: "suspended", joinedAt: "2026-08-15" },
  ...referredUsers,
];

// Campaign, wallet and activity history are the same for every user until the API is wired.
export const mockUserCampaigns: UserCampaign[] = [
  { id: "c-1", name: "Summer Promo Blast", channel: "SMS", date: "2026-09-12", status: "completed" },
  { id: "c-2", name: "New Product Launch", channel: "Image", date: "2026-09-10", status: "active" },
  { id: "c-3", name: "Weekend Flash Sale", channel: "SMS", date: "2026-09-06", status: "completed" },
  { id: "c-4", name: "Loyalty Rewards Update", channel: "SMS", date: "2026-09-02", status: "failed" },
];

export const mockWalletTransactions: WalletTransaction[] = [
  { id: "w-1", label: "Wallet top-up", date: "2026-09-11", amount: 10000 },
  { id: "w-2", label: "Campaign charge", date: "2026-09-09", amount: -4500 },
  { id: "w-3", label: "Referral bonus", date: "2026-09-07", amount: 500 },
  { id: "w-4", label: "Audience rental", date: "2026-09-04", amount: -2000 },
];

const HOUR = 60 * 60 * 1000;
const hoursAgo = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString();

type ActivityTemplate = Omit<UserActivity, "id" | "at">;

const activityTemplates = {
  login: { type: "account", text: "Logged in to the platform.", icon: LogIn, tone: "purple" },
  smsCampaign: { type: "campaign", text: "Created a new SMS campaign.", icon: Megaphone, tone: "green" },
  imageCampaign: { type: "campaign", text: "Created a new image campaign.", icon: Megaphone, tone: "green" },
  topUp: { type: "wallet", text: "Topped up wallet balance.", icon: Wallet, tone: "blue" },
  referral: { type: "referral", text: "Referred a new user.", icon: UserStar, tone: "gray" },
  profile: { type: "account", text: "Updated account profile.", icon: UserCog, tone: "purple" },
} satisfies Record<string, ActivityTemplate>;

const activityEntries: [ActivityTemplate, number][] = [
  [activityTemplates.login, 2],
  [activityTemplates.smsCampaign, 26],
  [activityTemplates.topUp, 50],
  [activityTemplates.referral, 74],
  [{ type: "campaign", text: "Campaign GP-2026-00321 completed.", icon: CheckCheck, tone: "green" }, 98],
  [{ type: "wallet", text: "Wallet funded with ₦50,000.", icon: CircleDollarSign, tone: "blue" }, 122],
  [activityTemplates.profile, 146],
  [activityTemplates.imageCampaign, 170],
  [{ type: "campaign", text: "Campaign GP-2026-00315 failed.", icon: CircleX, tone: "red" }, 194],
  [{ type: "wallet", text: "Wallet debited ₦4,500 for campaign.", icon: CreditCard, tone: "gray" }, 218],
  [activityTemplates.login, 242],
  [activityTemplates.smsCampaign, 266],
  [{ type: "referral", text: "Earned a ₦500 referral bonus.", icon: Gift, tone: "green" }, 290],
  [activityTemplates.login, 314],
  [{ type: "campaign", text: "Campaign GP-2026-00298 completed.", icon: CheckCheck, tone: "green" }, 338],
  [activityTemplates.topUp, 362],
  [{ type: "wallet", text: "Wallet debited ₦2,000 for audience rental.", icon: CreditCard, tone: "gray" }, 386],
  [activityTemplates.imageCampaign, 410],
  [activityTemplates.login, 434],
  [activityTemplates.referral, 458],
  [activityTemplates.profile, 482],
  [{ type: "wallet", text: "Wallet funded with ₦20,000.", icon: CircleDollarSign, tone: "blue" }, 506],
  [activityTemplates.smsCampaign, 530],
  [activityTemplates.login, 554],
];

export const mockUserActivity: UserActivity[] = activityEntries.map(([template, hours], index) => ({
  ...template,
  id: `a-${index + 1}`,
  at: hoursAgo(hours),
}));

// ── Campaign management ─────────────────────────────────────────────────────

const SENDER = "Global Pride";

export const mockCampaigns: Campaign[] = [
  { id: "GP-2026-00321", name: "Summer Promo Blast", type: "SMS", userId: "u-1001", userName: "John Doe", sender: SENDER, recipients: 10000, status: "completed", createdAt: "2026-09-12", delivery: { delivered: 9820, failed: 180, pending: 0 } },
  { id: "GP-2026-00318", name: "New Product Launch", type: "Image", userId: "u-1002", userName: "Sarah Ade", sender: SENDER, recipients: 5000, status: "active", createdAt: "2026-09-10", delivery: { delivered: 4120, failed: 60, pending: 820 } },
  { id: "GP-2026-00314", name: "Weekend Flash Sale", type: "SMS", userId: "u-1004", userName: "Amaka Bello", sender: SENDER, recipients: 8500, status: "scheduled", createdAt: "2026-09-09" },
  { id: "GP-2026-00309", name: "Loyalty Rewards", type: "SMS", userId: "u-1003", userName: "Michael Okoro", sender: SENDER, recipients: 3200, status: "failed", createdAt: "2026-09-08", delivery: { delivered: 640, failed: 2480, pending: 80 } },
  { id: "GP-2026-00302", name: "Customer Appreciation", type: "SMS", userId: "u-1005", userName: "David James", sender: SENDER, recipients: 6400, status: "completed", createdAt: "2026-09-05", delivery: { delivered: 6290, failed: 110, pending: 0 } },
  { id: "GP-2026-00298", name: "Flash Discount Alert", type: "SMS", userId: "u-1006", userName: "Chioma Eze", sender: SENDER, recipients: 4800, status: "cancelled", createdAt: "2026-09-04" },
  { id: "GP-2026-00294", name: "Brand Awareness Push", type: "Image", userId: "u-1007", userName: "Tunde Bakare", sender: SENDER, recipients: 12000, status: "completed", createdAt: "2026-09-02", delivery: { delivered: 11760, failed: 240, pending: 0 } },
  { id: "GP-2026-00288", name: "Holiday Greetings", type: "SMS", userId: "u-1008", userName: "Ngozi Okafor", sender: SENDER, recipients: 7600, status: "active", createdAt: "2026-08-30", delivery: { delivered: 5320, failed: 90, pending: 2190 } },
  { id: "GP-2026-00281", name: "Product Restock Alert", type: "SMS", userId: "u-1009", userName: "Emeka Nwosu", sender: SENDER, recipients: 2000, status: "completed", createdAt: "2026-08-27", delivery: { delivered: 1968, failed: 32, pending: 0 } },
  { id: "GP-2026-00276", name: "Customer Feedback Request", type: "Image", userId: "u-1010", userName: "Aisha Bello", sender: SENDER, recipients: 1500, status: "failed", createdAt: "2026-08-25", delivery: { delivered: 420, failed: 1010, pending: 70 } },
  { id: "GP-2026-00271", name: "Back to School Promo", type: "SMS", userId: "u-1011", userName: "Femi Adeyemi", sender: SENDER, recipients: 9000, status: "completed", createdAt: "2026-08-22", delivery: { delivered: 8840, failed: 160, pending: 0 } },
  { id: "GP-2026-00265", name: "Midweek Deals", type: "SMS", userId: "u-1001", userName: "John Doe", sender: SENDER, recipients: 3500, status: "completed", createdAt: "2026-08-20", delivery: { delivered: 3430, failed: 70, pending: 0 } },
  { id: "GP-2026-00259", name: "App Download Drive", type: "Image", userId: "u-1002", userName: "Sarah Ade", sender: SENDER, recipients: 6000, status: "completed", createdAt: "2026-08-18", delivery: { delivered: 5880, failed: 120, pending: 0 } },
  { id: "GP-2026-00252", name: "Weekend Brunch Offer", type: "SMS", userId: "u-1012", userName: "Halima Musa", sender: SENDER, recipients: 1200, status: "cancelled", createdAt: "2026-08-15" },
  { id: "GP-2026-00247", name: "Referral Bonus Reminder", type: "SMS", userId: "u-1004", userName: "Amaka Bello", sender: SENDER, recipients: 4200, status: "completed", createdAt: "2026-08-13", delivery: { delivered: 4110, failed: 90, pending: 0 } },
  { id: "GP-2026-00240", name: "New Branch Opening", type: "Image", userId: "u-1006", userName: "Chioma Eze", sender: SENDER, recipients: 8000, status: "failed", createdAt: "2026-08-10", delivery: { delivered: 2400, failed: 5300, pending: 300 } },
  { id: "GP-2026-00236", name: "Price Drop Alert", type: "SMS", userId: "u-1009", userName: "Emeka Nwosu", sender: SENDER, recipients: 2800, status: "completed", createdAt: "2026-08-07", delivery: { delivered: 2750, failed: 50, pending: 0 } },
  { id: "GP-2026-00231", name: "Customer Survey", type: "SMS", userId: "u-1005", userName: "David James", sender: SENDER, recipients: 1800, status: "completed", createdAt: "2026-08-05", delivery: { delivered: 1760, failed: 40, pending: 0 } },
];

// Every campaign previews the same contact list; only the delivery statuses differ by campaign status.
const recipientContacts = [
  ["Ada Nwankwo", "0803 111 2233"],
  ["Bola Saraki", "0806 222 3344"],
  ["Chidi Okafor", "0812 333 4455"],
  ["Damilola Ayeni", "0903 444 5566"],
  ["Efe Okon", "0704 555 6677"],
  ["Fatima Sani", "0815 666 7788"],
  ["Gbenga Adewale", "0902 777 8899"],
  ["Hauwa Ibrahim", "0807 888 9900"],
  ["Ifeanyi Chukwu", "0816 999 0011"],
  ["Jumoke Alade", "0905 010 1122"],
  ["Kunle Bamidele", "0803 121 2344"],
  ["Lami Danjuma", "0806 232 3455"],
  ["Musa Abubakar", "0812 343 4566"],
  ["Nkechi Obi", "0903 454 5677"],
  ["Olumide Fashola", "0704 565 6788"],
  ["Patience Etim", "0815 676 7899"],
  ["Rotimi Ogunleye", "0902 787 8900"],
  ["Sade Adebayo", "0807 898 9011"],
  ["Tobi Akinola", "0816 909 0122"],
  ["Uche Nnamdi", "0905 101 1233"],
  ["Victoria Ekpo", "0803 212 2345"],
  ["Wale Oyelaran", "0806 323 3456"],
  ["Yemi Alabi", "0812 434 4567"],
  ["Zainab Lawal", "0903 545 5678"],
] as const;

/** Default status per campaign status, plus per-row exceptions (by index). */
const recipientStatusRules: Record<
  CampaignStatus,
  { base: RecipientStatus; except?: Record<number, RecipientStatus> }
> = {
  completed: { base: "delivered", except: { 3: "failed", 9: "failed", 17: "failed" } },
  active: {
    base: "delivered",
    except: { 2: "failed", 3: "pending", 5: "pending", 11: "pending", 14: "failed", 19: "pending", 22: "pending" },
  },
  failed: {
    base: "failed",
    except: { 0: "delivered", 3: "delivered", 5: "pending", 12: "delivered", 20: "pending" },
  },
  scheduled: { base: "pending" },
  cancelled: { base: "not_sent" },
};

export const getCampaignRecipients = (campaign: Campaign): CampaignRecipient[] => {
  const rule = recipientStatusRules[campaign.status];
  return recipientContacts.map(([name, phone], index) => ({
    id: `r-${index + 1}`,
    name,
    phone,
    status: rule.except?.[index] ?? rule.base,
  }));
};

type LogStep = Omit<CampaignLogEntry, "id" | "at"> & { time: string };

const logSteps = {
  created: { text: "Campaign created.", time: "09:02", icon: CirclePlus, tone: "purple" },
  audience: { text: "Audience approved and confirmed.", time: "09:14", icon: Users, tone: "gray" },
  charged: { text: "Wallet charged for campaign delivery.", time: "09:20", icon: Wallet, tone: "blue" },
  scheduled: { text: "Campaign scheduled for delivery.", time: "09:21", icon: CalendarCheck, tone: "purple" },
  sending: { text: "Campaign started sending.", time: "09:30", icon: Send, tone: "purple" },
  cancelled: { text: "Campaign cancelled before delivery.", time: "09:40", icon: CircleX, tone: "gray" },
  interrupted: { text: "Delivery interrupted.", time: "10:05", icon: CircleAlert, tone: "amber" },
  failed: { text: "Campaign failed.", time: "10:06", icon: CircleX, tone: "red" },
  inProgress: { text: "Delivery in progress.", time: "10:12", icon: Clock, tone: "purple" },
  completed: { text: "Delivery completed successfully.", time: "10:48", icon: CheckCheck, tone: "green" },
} satisfies Record<string, LogStep>;

const logFlows: Record<CampaignStatus, (keyof typeof logSteps)[]> = {
  scheduled: ["created", "audience", "charged", "scheduled"],
  active: ["created", "audience", "charged", "scheduled", "sending", "inProgress"],
  completed: ["created", "audience", "charged", "scheduled", "sending", "completed"],
  failed: ["created", "audience", "charged", "sending", "interrupted", "failed"],
  cancelled: ["created", "audience", "cancelled"],
};

export const getCampaignLog = (campaign: Campaign): CampaignLogEntry[] =>
  logFlows[campaign.status].map((key) => {
    const { time, ...step } = logSteps[key];
    // No offset → parsed as local time, so the log shows the same clock time everywhere.
    return { ...step, id: key, at: `${campaign.createdAt}T${time}:00` };
  });

export const mockServicePrices: ServicePrice[] = [
  { id: "sms", name: "SMS Campaign", price: 4, unit: "Per recipient", status: "active" },
  { id: "image", name: "Image Campaign", price: 5, unit: "Per recipient", status: "active" },
  { id: "audience_rental", name: "Audience Rental", price: 10, unit: "Per recipient", status: "active" },
  { id: "voice", name: "Voice Campaign", price: null, unit: "Per recipient", status: "coming_soon" },
  { id: "video", name: "Video Campaign", price: null, unit: "Per recipient", status: "coming_soon" },
];

export const mockVatRate = 7.5;

export const mockReferralBonus: ReferralBonus = {
  amount: 500,
  rewardType: "wallet_credit",
  trigger: "successful_referral",
  status: "active",
};

export const mockPromotions: Promotion[] = [
  {
    id: "PROMO-001",
    name: "Welcome Bonus",
    discountType: "percentage",
    discountValue: 10,
    appliesTo: "sms",
    status: "active",
    startDate: "2026-09-01",
    endDate: "2026-09-30",
  },
  {
    id: "PROMO-002",
    name: "Image Campaign Offer",
    discountType: "percentage",
    discountValue: 15,
    appliesTo: "image",
    status: "scheduled",
    startDate: "2026-10-01",
    endDate: "2026-10-15",
  },
  {
    id: "PROMO-003",
    name: "Audience Saver",
    discountType: "fixed",
    discountValue: 2,
    appliesTo: "audience_rental",
    status: "expired",
    startDate: "2026-08-01",
    endDate: "2026-08-20",
  },
];

// ---- Audience Marketplace ----

// [state, total records, last updated]. Totals add up to 2,845,320.
const audienceStateSeeds: [string, number, string][] = [
  ["Abia", 51500, "2026-09-18"],
  ["Adamawa", 41750, "2026-09-18"],
  ["Akwa Ibom", 66000, "2026-09-17"],
  ["Anambra", 76500, "2026-09-17"],
  ["Bauchi", 48375, "2026-09-16"],
  ["Bayelsa", 30750, "2026-09-16"],
  ["Benue", 45625, "2026-09-15"],
  ["Borno", 39000, "2026-09-15"],
  ["Cross River", 43625, "2026-09-14"],
  ["Delta", 86125, "2026-09-14"],
  ["Ebonyi", 34125, "2026-09-13"],
  ["Edo", 75500, "2026-09-13"],
  ["Ekiti", 32250, "2026-09-12"],
  ["Enugu", 68250, "2026-09-12"],
  ["Gombe", 29500, "2026-09-11"],
  ["Imo", 71875, "2026-09-11"],
  ["Jigawa", 42250, "2026-09-10"],
  ["Kaduna", 98500, "2026-09-19"],
  ["Kano", 156750, "2026-09-19"],
  ["Katsina", 84375, "2026-09-10"],
  ["Kebbi", 31875, "2026-09-09"],
  ["Kogi", 47250, "2026-09-09"],
  ["Kwara", 52625, "2026-09-18"],
  ["Lagos", 592570, "2026-09-20"],
  ["Nasarawa", 33750, "2026-09-08"],
  ["Niger", 58125, "2026-09-08"],
  ["Ogun", 112500, "2026-09-19"],
  ["Ondo", 61375, "2026-09-07"],
  ["Osun", 64250, "2026-09-07"],
  ["Oyo", 128625, "2026-09-19"],
  ["Plateau", 49875, "2026-09-06"],
  ["Rivers", 142250, "2026-09-20"],
  ["Sokoto", 44125, "2026-09-06"],
  ["Taraba", 28750, "2026-09-05"],
  ["Yobe", 26375, "2026-09-05"],
  ["Zamfara", 30125, "2026-09-04"],
  ["FCT", 118250, "2026-09-20"],
];

/** Deterministic 0–1 value per string, so mock numbers don't change between reloads. */
const seededRandom = (value: string) => {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
};

export const getLgaId = (stateId: string, lgaName: string) => `${stateId}-${toSlug(lgaName)}`;

export const mockAudienceStates: AudienceState[] = audienceStateSeeds.map(([name, , lastUpdated]) => ({
  id: toSlug(name),
  name,
  status: name === "Taraba" ? "inactive" : "active",
  lastUpdated,
}));

// Spread each state's total across its LGAs with uneven, seeded weights.
export const mockAudienceLgas: AudienceLga[] = audienceStateSeeds.flatMap(([stateName, total, lastUpdated]) => {
  const stateId = toSlug(stateName);
  const names = nigeriaLgas[stateName];
  const weights = names.map((name) => 0.5 + seededRandom(`${stateName}/${name}`));
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const totals = weights.map((weight) => Math.floor((total * weight) / weightSum));
  totals[0] += total - totals.reduce((sum, value) => sum + value, 0);

  return names.map((name, index) => ({
    id: getLgaId(stateId, name),
    stateId,
    name,
    totalRecords: totals[index],
    availableRecords: Math.round(totals[index] * (0.93 + 0.04 * seededRandom(name))),
    status: "active" as const,
    lastUpdated,
  }));
});

const audienceRecordSeeds: [string, string, string, string, string, Gender][] = [
  ["08054072380", "Usman", "Haruna", "Kwara", "Kaiama", "male"],
  ["08162942242", "Bashir", "Yakub", "Kwara", "Kaiama", "male"],
  ["08136184739", "Ibrahim", "Gunu", "Kwara", "Kaiama", "male"],
  ["08077653334", "Mohammed", "Haruna", "Kwara", "Kaiama", "male"],
  ["08063864431", "Rakiya", "Brahim", "Kwara", "Kaiama", "female"],
  ["08034567890", "Amina", "Sule", "Kwara", "Ilorin West", "female"],
  ["08023456789", "Yusuf", "Bello", "Kwara", "Ilorin East", "male"],
  ["08123456780", "Zainab", "Musa", "Lagos", "Ikeja", "female"],
  ["07012345678", "Chinedu", "Okeke", "Lagos", "Ikeja", "male"],
  ["07034567890", "Adeola", "Balogun", "Lagos", "Surulere", "male"],
];

const maleNames = ["Emeka", "Tunde", "Segun", "Ifeanyi", "Abdullahi", "Kelechi", "Femi", "Musa", "Obinna", "Sani", "Uche", "Babatunde"];
const femaleNames = ["Ngozi", "Funmi", "Aisha", "Chioma", "Hauwa", "Bukola", "Ada", "Kemi", "Halima", "Ifeoma", "Yetunde", "Blessing"];
const lastNames = ["Adeyemi", "Okafor", "Ibrahim", "Eze", "Abubakar", "Ogunleye", "Nwosu", "Lawal", "Okonkwo", "Danjuma", "Afolabi", "Etim", "Bassey", "Olawale", "Garba"];
const recordStates = ["Lagos", "Oyo", "Rivers", "FCT", "Kano", "Enugu", "Ogun", "Abia", "Kaduna", "Delta", "Edo", "Anambra", "Taraba"];
const phonePrefixes = ["0803", "0806", "0813", "0816", "0703", "0706", "0810", "0905"];

const generatedRecordSeeds = Array.from({ length: 46 }, (_, index): (typeof audienceRecordSeeds)[number] => {
  const gender: Gender = index % 3 === 1 ? "female" : "male";
  const firstNames = gender === "male" ? maleNames : femaleNames;
  const state = recordStates[index % recordStates.length];
  const lgas = nigeriaLgas[state];
  const phoneSuffix = String(Math.floor(seededRandom(`phone-${index}`) * 1e7)).padStart(7, "0");

  return [
    `${phonePrefixes[index % phonePrefixes.length]}${phoneSuffix}`,
    firstNames[(index * 5) % firstNames.length],
    lastNames[(index * 7) % lastNames.length],
    state,
    lgas[(index * 3) % lgas.length],
    gender,
  ];
});

export const mockAudienceRecords: AudienceRecord[] = [...audienceRecordSeeds, ...generatedRecordSeeds].map(
  ([phone, firstName, lastName, state, lga, gender], index) => {
    const stateId = toSlug(state);
    return {
      id: `AUD-${String(index + 1).padStart(5, "0")}`,
      phone,
      firstName,
      lastName,
      stateId,
      lgaId: getLgaId(stateId, lga),
      gender,
    };
  },
);

// ---- Wallet Management ----

// Platform-wide headline figures; the transaction list below is only a sample.
export const walletStats = {
  totalBalance: 42_800_000,
  totalFunding: 68_400_000,
  referralBonusesPaid: referralProgramStats.bonusesPaid,
  transactionCount: 12_846,
};

type LedgerSeed = Omit<WalletLedgerEntry, "userName">;

const ledgerSeeds: LedgerSeed[] = [
  { id: "TXN-001310", userId: "u-1007", type: "referral_bonus", amount: 500, status: "successful", createdAt: "2026-09-13T10:30:00", previousBalance: 42750, referralId: "REF-001833" },
  { id: "TXN-001309", userId: "u-1011", type: "referral_bonus", amount: 500, status: "successful", createdAt: "2026-09-26T14:00:00", previousBalance: 21600, referralId: "REF-001849" },
  { id: "TXN-001308", userId: "u-1009", type: "refund", amount: 16125, status: "refunded", createdAt: "2026-09-25T15:10:00", previousBalance: 24650, originalTransactionId: "TXN-001287" },
  { id: "TXN-001307", userId: "u-1005", type: "refund", amount: 4300, status: "refunded", createdAt: "2026-09-26T12:40:00", previousBalance: 3200, originalTransactionId: "TXN-001288" },
  { id: "TXN-001306", userId: "u-1007", type: "refund", amount: 5375, status: "refunded", createdAt: "2026-09-27T09:20:00", previousBalance: 13375, originalTransactionId: "TXN-001289" },
  { id: "TXN-001305", userId: "u-1002", type: "referral_bonus", amount: 500, status: "successful", createdAt: "2026-09-25T13:05:00", previousBalance: 11500, referralId: "REF-001846" },
  { id: "TXN-001304", userId: "u-1004", type: "referral_bonus", amount: 500, status: "successful", createdAt: "2026-09-26T10:15:00", previousBalance: 84400, referralId: "REF-001848" },
  { id: "TXN-001303", userId: "u-1006", type: "referral_bonus", amount: 500, status: "successful", createdAt: "2026-09-27T16:30:00", previousBalance: 30700, referralId: "REF-001850" },
  { id: "TXN-001302", userId: "u-1001", type: "wallet_funding", amount: 80000, status: "successful", createdAt: "2026-09-26T08:45:00", previousBalance: 12500, payment: { reference: "PAY-92837330", method: "card" } },
  { id: "TXN-001301", userId: "u-1012", type: "wallet_funding", amount: 45000, status: "successful", createdAt: "2026-09-27T11:10:00", previousBalance: 1500, payment: { reference: "PAY-92837412", method: "bank_transfer" } },
  { id: "TXN-001300", userId: "u-1011", type: "wallet_funding", amount: 120000, status: "successful", createdAt: "2026-09-28T09:00:00", previousBalance: 22100, payment: { reference: "PAY-92837550", method: "card" } },
  { id: "TXN-001299", userId: "u-1010", type: "audience_rental", amount: -16125, status: "successful", createdAt: "2026-09-24T14:35:00", previousBalance: 20000, campaignId: "GP-2026-00276" },
  { id: "TXN-001298", userId: "u-1009", type: "sms_campaign", amount: -32250, status: "successful", createdAt: "2026-09-25T10:25:00", previousBalance: 89150, campaignId: "GP-2026-00281" },
  { id: "TXN-001297", userId: "u-1005", type: "image_campaign", amount: -4300, status: "successful", createdAt: "2026-09-25T09:50:00", previousBalance: 11800, campaignId: "GP-2026-00318" },
  { id: "TXN-001296", userId: "u-1008", type: "sms_campaign", amount: -10750, status: "successful", createdAt: "2026-09-26T15:05:00", previousBalance: 15050, campaignId: "GP-2026-00288" },
  { id: "TXN-001295", userId: "u-1007", type: "audience_rental", amount: -5375, status: "successful", createdAt: "2026-09-26T11:30:00", previousBalance: 24125, campaignId: "GP-2026-00294" },
  { id: "TXN-001294", userId: "u-1006", type: "image_campaign", amount: -8600, status: "successful", createdAt: "2026-09-27T13:15:00", previousBalance: 39800, campaignId: "GP-2026-00298" },
  { id: "TXN-001293", userId: "u-1003", type: "sms_campaign", amount: -21500, status: "successful", createdAt: "2026-09-27T10:40:00", previousBalance: 21500, campaignId: "GP-2026-00314" },
  { id: "TXN-001292", userId: "u-1004", type: "audience_rental", amount: -10750, status: "successful", createdAt: "2026-09-28T14:20:00", previousBalance: 96150, campaignId: "GP-2026-00314" },
  { id: "TXN-001291", userId: "u-1002", type: "image_campaign", amount: -5375, status: "successful", createdAt: "2026-09-28T11:05:00", previousBalance: 17375, campaignId: "GP-2026-00259" },
  { id: "TXN-001290", userId: "u-1001", type: "sms_campaign", amount: -4300, status: "successful", createdAt: "2026-09-28T09:35:00", previousBalance: 46800, campaignId: "GP-2026-00321" },
  { id: "TXN-001289", userId: "u-1007", type: "audience_rental", amount: -5375, status: "refunded", createdAt: "2026-09-24T12:10:00", previousBalance: 13375, campaignId: "GP-2026-00294" },
  { id: "TXN-001288", userId: "u-1005", type: "image_campaign", amount: -4300, status: "refunded", createdAt: "2026-09-23T15:45:00", previousBalance: 7500, campaignId: "GP-2026-00318" },
  { id: "TXN-001287", userId: "u-1009", type: "sms_campaign", amount: -16125, status: "refunded", createdAt: "2026-09-22T10:55:00", previousBalance: 40775, campaignId: "GP-2026-00281" },
  { id: "TXN-001285", userId: "u-1002", type: "wallet_funding", amount: 20000, status: "pending", createdAt: "2026-09-25T11:20:00", previousBalance: 5000, payment: { reference: "PAY-92837011", method: "bank_transfer" } },
  { id: "TXN-001284", userId: "u-1001", type: "wallet_funding", amount: 50000, status: "successful", createdAt: "2026-09-24T10:42:00", previousBalance: 20000, payment: { reference: "PAY-92837164", method: "card" } },
  { id: "TXN-001283", userId: "u-1002", type: "sms_campaign", amount: -4300, status: "successful", createdAt: "2026-09-24T09:15:00", previousBalance: 20000, campaignId: "GP-2026-00321" },
  { id: "TXN-001999", userId: "u-1001", type: "referral_bonus", amount: 500, status: "successful", createdAt: "2026-09-23T10:42:00", previousBalance: 10000, referralId: "REF-001842" },
  { id: "TXN-001282", userId: "u-1004", type: "audience_rental", amount: -10000, status: "successful", createdAt: "2026-09-23T09:05:00", previousBalance: 95400, campaignId: "GP-2026-00314" },
  { id: "TXN-001281", userId: "u-1003", type: "referral_bonus", amount: 500, status: "successful", createdAt: "2026-09-23T08:30:00", previousBalance: 0, referralId: "REF-001839" },
  { id: "TXN-001280", userId: "u-1005", type: "image_campaign", amount: -5000, status: "failed", createdAt: "2026-09-22T11:48:00", previousBalance: 5000, campaignId: "GP-2026-00318" },
  { id: "TXN-001279", userId: "u-1006", type: "wallet_funding", amount: 100000, status: "successful", createdAt: "2026-09-21T14:10:00", previousBalance: 31200, payment: { reference: "PAY-92836540", method: "card" } },
  { id: "TXN-001278", userId: "u-1007", type: "sms_campaign", amount: -12000, status: "successful", createdAt: "2026-09-20T16:25:00", previousBalance: 30750, campaignId: "GP-2026-00294" },
  { id: "TXN-001277", userId: "u-1008", type: "refund", amount: 4300, status: "refunded", createdAt: "2026-09-20T10:02:00", previousBalance: 4300, originalTransactionId: "TXN-001250" },
  { id: "TXN-001276", userId: "u-1009", type: "wallet_funding", amount: 25000, status: "failed", createdAt: "2026-09-19T13:40:00", previousBalance: 56900, payment: { reference: "PAY-92836102", method: "card" } },
  { id: "TXN-001275", userId: "u-1009", type: "sms_campaign", amount: -8000, status: "successful", createdAt: "2026-09-19T09:12:00", previousBalance: 64900, campaignId: "GP-2026-00281" },
  { id: "TXN-001274", userId: "u-1011", type: "wallet_funding", amount: 30000, status: "successful", createdAt: "2026-09-18T17:05:00", previousBalance: 2100, payment: { reference: "PAY-92835877", method: "bank_transfer" } },
  { id: "TXN-001273", userId: "u-1011", type: "sms_campaign", amount: -36000, status: "successful", createdAt: "2026-09-18T12:30:00", previousBalance: 38100, campaignId: "GP-2026-00271" },
  { id: "TXN-001272", userId: "u-1010", type: "image_campaign", amount: -7500, status: "failed", createdAt: "2026-09-17T15:22:00", previousBalance: 0, campaignId: "GP-2026-00276" },
  { id: "TXN-001271", userId: "u-1004", type: "referral_bonus", amount: 500, status: "pending", createdAt: "2026-09-17T11:00:00", previousBalance: 94900, referralId: "REF-001835" },
  { id: "TXN-001270", userId: "u-1006", type: "audience_rental", amount: -6000, status: "pending", createdAt: "2026-09-16T10:18:00", previousBalance: 37200, campaignId: "GP-2026-00298" },
  { id: "TXN-001269", userId: "u-1012", type: "wallet_funding", amount: 1500, status: "successful", createdAt: "2026-09-15T09:45:00", previousBalance: 0, payment: { reference: "PAY-92835210", method: "card" } },
  { id: "TXN-001268", userId: "u-1001", type: "sms_campaign", amount: -14000, status: "successful", createdAt: "2026-09-14T14:50:00", previousBalance: 34000, campaignId: "GP-2026-00265" },
  { id: "TXN-001267", userId: "u-1002", type: "image_campaign", amount: -30000, status: "successful", createdAt: "2026-09-13T16:35:00", previousBalance: 50000, campaignId: "GP-2026-00259" },
  { id: "TXN-001266", userId: "u-1007", type: "wallet_funding", amount: 40000, status: "successful", createdAt: "2026-09-12T08:55:00", previousBalance: 2750, payment: { reference: "PAY-92834633", method: "bank_transfer" } },
  { id: "TXN-001265", userId: "u-1005", type: "referral_bonus", amount: 500, status: "failed", createdAt: "2026-09-11T12:05:00", previousBalance: 7000, referralId: "REF-001830" },
  { id: "TXN-001264", userId: "u-1009", type: "audience_rental", amount: -12000, status: "successful", createdAt: "2026-09-10T10:40:00", previousBalance: 76900, campaignId: "GP-2026-00236" },
  { id: "TXN-001250", userId: "u-1008", type: "sms_campaign", amount: -4300, status: "refunded", createdAt: "2026-09-08T15:30:00", previousBalance: 8600, campaignId: "GP-2026-00288" },
];

export const mockWalletLedger: WalletLedgerEntry[] = ledgerSeeds.map((seed) => ({
  ...seed,
  userName: mockUsers.find((user) => user.id === seed.userId)?.name ?? "Unknown user",
}));

// ---- Finance & Reports ----

// Platform-wide headline figures for the reports; the activity tables list
// the matching sample rows from `mockWalletLedger`.
export const financeStats = {
  /** VAT rate (percent) applied to the charges in these figures. */
  vatRate: 7.5,
  /** Service revenue, excluding VAT. */
  revenue: [
    { type: "sms_campaign", amount: 10_200_000, transactions: 2_540 },
    { type: "image_campaign", amount: 3_800_000, transactions: 760 },
    { type: "audience_rental", amount: 4_400_000, transactions: 440 },
  ] satisfies { type: WalletTransactionType; amount: number; transactions: number }[],
  walletFunding: {
    successful: walletStats.totalFunding,
    transactions: 3_842,
    pending: 2_800_000,
    failed: 1_600_000,
  },
  referrals: referralProgramStats,
  refunds: { total: 420_000, count: 96, successful: 96 },
};

// ---- Referral Management ----

export const mockReferrals: Referral[] = referralSeeds.map(
  ([id, referrerId, referredUserName, createdAt, bonusTransactionId], index) => ({
    id,
    code: `GP-REF-${id.slice(-4)}`,
    referrerId,
    referrerName: mockUsers.find((user) => user.id === referrerId)?.name ?? "Unknown user",
    referredUserId: referredUserId(index),
    referredUserName,
    createdAt,
    status: bonusTransactionId ? "successful" : "pending",
    // A bonus is issued the moment its referral qualifies.
    qualifiedAt: mockWalletLedger.find((transaction) => transaction.id === bonusTransactionId)?.createdAt,
    bonusTransactionId,
  }),
);

// ---- Advertisement Management ----

// Statuses are stored rather than derived from the schedule because the mock
// dates are in the past; new ads get theirs from the start time when saved.
export const mockAdvertisements: Advertisement[] = [
  {
    id: "AD-1001",
    name: "October Business Promotion",
    advertiser: "Lagos Business Hub",
    description: "Featured listing promotion for SME registration week.",
    creative: makeCreative({ from: "#1e3a8a", to: "#0f172a", accent: "#93c5fd", eyebrow: "Nigerian innovation", lines: ["Build. Scale.", "Impact."] }),
    ctaLabel: "Learn More",
    destinationUrl: "https://lagosbusinesshub.ng/october-promotion",
    placement: "home_feed",
    status: "active",
    createdAt: "2026-09-12",
    startAt: "2026-09-15T09:00",
    endAt: "2026-10-20T23:59",
    impressions: 22_320,
    clicks: 1_044,
  },
  {
    id: "AD-1002",
    name: "Pride Fitness Weekend",
    advertiser: "FitLife Gym",
    description: "Free weekend passes for new members.",
    creative: makeCreative({ from: "#334155", to: "#0f172a", accent: "#fbbf24", eyebrow: "FitLife Gym", lines: ["Train hard.", "Live proud."] }),
    ctaLabel: "Join Now",
    destinationUrl: "https://fitlifegym.ng/pride-weekend",
    placement: "home_feed",
    status: "active",
    createdAt: "2026-09-24",
    startAt: "2026-09-28T06:00",
    endAt: "2026-10-12T23:59",
    impressions: 4_300,
    clicks: 205,
  },
  {
    id: "AD-1003",
    name: "Naira Transfer Zero Fees",
    advertiser: "SwiftPay Nigeria",
    description: "Zero-fee transfers campaign for new SwiftPay users.",
    creative: makeCreative({ from: "#0d9488", to: "#065f46", accent: "#a7f3d0", eyebrow: "SwiftPay", lines: ["Send naira.", "Pay ₦0 fees."] }),
    ctaLabel: "Get Started",
    destinationUrl: "https://swiftpay.ng/zero-fees",
    placement: "home_feed",
    status: "active",
    createdAt: "2026-09-17",
    startAt: "2026-09-20T00:00",
    endAt: "2026-11-15T23:59",
    impressions: 19_760,
    clicks: 1_248,
  },
  {
    id: "AD-1004",
    name: "Fresh Groceries Delivered",
    advertiser: "GreenBasket",
    description: "Same-day grocery delivery launch in Lagos.",
    creative: makeCreative({ from: "#65a30d", to: "#166534", accent: "#fef08a", eyebrow: "GreenBasket", lines: ["Fresh food,", "at your door."] }),
    ctaLabel: "Order Now",
    destinationUrl: "https://greenbasket.ng/delivery",
    placement: "home_feed",
    status: "active",
    createdAt: "2026-09-27",
    startAt: "2026-09-30T08:00",
    endAt: "2026-10-31T23:59",
    impressions: 1_920,
    clicks: 81,
  },
  {
    id: "AD-1005",
    name: "October Fest Deals",
    advertiser: "MegaMart Stores",
    description: "Retail shopping festival discounts.",
    creative: makeCreative({ from: "#ec4899", to: "#f97316", accent: "#fef3c7", eyebrow: "Retail shopping", lines: ["Shopping", "Festival"] }),
    ctaLabel: "Shop Now",
    destinationUrl: "https://megamart.ng/october-fest",
    placement: "home_feed",
    status: "scheduled",
    createdAt: "2026-09-30",
    startAt: "2026-10-05T00:00",
    endAt: "2026-10-20T23:59",
  },
  {
    id: "AD-1006",
    name: "Diwali Special Fashion",
    advertiser: "Aso-Ebi Couture",
    description: "Festive collection launch.",
    creative: makeCreative({ from: "#b45309", to: "#7f1d1d", accent: "#fde68a", eyebrow: "Aso-Ebi Couture", lines: ["Festive", "collection"] }),
    ctaLabel: "Shop Now",
    destinationUrl: "https://asoebicouture.ng/diwali",
    placement: "home_feed",
    status: "scheduled",
    createdAt: "2026-10-02",
    startAt: "2026-10-10T00:00",
    endAt: "2026-11-02T23:59",
  },
  {
    id: "AD-1007",
    name: "Back to School Supplies",
    advertiser: "BrightBooks",
    description: "Back-to-school stationery bundle.",
    creative: makeCreative({ from: "#2563eb", to: "#7c3aed", accent: "#fde047", eyebrow: "Better supplies", lines: ["Brighter", "futures"] }),
    ctaLabel: "Shop Now",
    destinationUrl: "https://brightbooks.ng/school",
    placement: "home_feed",
    status: "paused",
    createdAt: "2026-08-28",
    startAt: "2026-09-01T08:00",
    endAt: "2026-10-15T23:59",
    impressions: 17_280,
    clicks: 792,
  },
  {
    id: "AD-1008",
    name: "Premium Data Bundles",
    advertiser: "TeleCom Plus",
    description: "Discounted monthly data plans.",
    creative: makeCreative({ from: "#0284c7", to: "#1e40af", accent: "#bae6fd", eyebrow: "TeleCom Plus", lines: ["More data,", "less spend."] }),
    ctaLabel: "Buy Now",
    destinationUrl: "https://telecomplus.ng/data-bundles",
    placement: "home_feed",
    status: "paused",
    createdAt: "2026-09-06",
    startAt: "2026-09-10T00:00",
    endAt: "2026-10-25T23:59",
    impressions: 19_600,
    clicks: 1_220,
  },
  {
    id: "AD-1009",
    name: "Independence Day Sale",
    advertiser: "Unity Stores",
    description: "Independence Day storewide sale.",
    creative: makeCreative({ from: "#16a34a", to: "#14532d", accent: "#ffffff", eyebrow: "Independence Day", lines: ["Big sale.", "Proudly green."] }),
    ctaLabel: "Shop Now",
    destinationUrl: "https://unitystores.ng/independence",
    placement: "home_feed",
    status: "ended",
    createdAt: "2026-09-22",
    startAt: "2026-09-25T00:00",
    endAt: "2026-10-01T23:59",
    impressions: 11_760,
    clicks: 994,
  },
  {
    id: "AD-1010",
    name: "Eid Shopping Festival",
    advertiser: "Crescent Mall",
    description: "Eid festival discounts across all stores.",
    creative: makeCreative({ from: "#a16207", to: "#422006", accent: "#fde68a", eyebrow: "Crescent Mall", lines: ["Eid shopping", "festival"] }),
    ctaLabel: "Shop Now",
    destinationUrl: "https://crescentmall.ng/eid",
    placement: "home_feed",
    status: "ended",
    createdAt: "2026-08-15",
    startAt: "2026-08-20T00:00",
    endAt: "2026-09-05T23:59",
    impressions: 22_440,
    clicks: 1_496,
  },
  {
    id: "AD-1011",
    name: "Summer Travel Deals",
    advertiser: "SkyWay Travels",
    description: "Discounted domestic flights for August.",
    creative: makeCreative({ from: "#06b6d4", to: "#1d4ed8", accent: "#fef9c3", eyebrow: "SkyWay Travels", lines: ["Fly further,", "pay less."] }),
    ctaLabel: "Book Now",
    destinationUrl: "https://skywaytravels.ng/summer",
    placement: "home_feed",
    status: "ended",
    createdAt: "2026-07-28",
    startAt: "2026-08-01T00:00",
    endAt: "2026-08-31T23:59",
    impressions: 6_480,
    clicks: 312,
  },
  {
    id: "AD-1012",
    name: "Home Loan Week",
    advertiser: "Haven Mortgage Bank",
    description: "Reduced-rate mortgage applications.",
    creative: makeCreative({ from: "#475569", to: "#1e293b", accent: "#c4b5fd", eyebrow: "Haven Mortgage", lines: ["Own your", "home sooner."] }),
    ctaLabel: "Learn More",
    destinationUrl: "https://havenmortgage.ng/home-loan-week",
    placement: "home_feed",
    status: "ended",
    createdAt: "2026-08-05",
    startAt: "2026-08-10T09:00",
    endAt: "2026-08-24T23:59",
    impressions: 5_120,
    clicks: 246,
  },
  {
    id: "AD-1013",
    name: "Black Friday Countdown",
    advertiser: "ShopRight NG",
    description: "Black Friday early-access sign-ups.",
    creative: makeCreative({ from: "#18181b", to: "#3f3f46", accent: "#facc15", eyebrow: "ShopRight NG", lines: ["Black Friday", "is coming."] }),
    ctaLabel: "Shop Now",
    destinationUrl: "https://shopright.ng/black-friday",
    placement: "home_feed",
    status: "scheduled",
    createdAt: "2026-10-08",
    startAt: "2026-11-20T00:00",
    endAt: "2026-11-30T23:59",
  },
  {
    id: "AD-1014",
    name: "Christmas Hampers",
    advertiser: "Yuletide Gifts",
    description: "Corporate and family Christmas hampers.",
    creative: makeCreative({ from: "#dc2626", to: "#7f1d1d", accent: "#bbf7d0", eyebrow: "Yuletide Gifts", lines: ["Christmas", "hampers"] }),
    ctaLabel: "Order Now",
    destinationUrl: "https://yuletidegifts.ng/hampers",
    placement: "home_feed",
    status: "scheduled",
    createdAt: "2026-10-10",
    startAt: "2026-12-01T00:00",
    endAt: "2026-12-24T23:59",
  },
];

// ---- Support ----

const SUPPORT_ADMIN = "Support Admin";

type TicketSeed = Omit<SupportTicket, "userName" | "updatedAt" | "messages" | "notes"> & {
  /** First message from the user, sent when the ticket was created. */
  message: string;
  /** Later messages / notes as [body, ISO date-time]. */
  replies?: [string, string][];
  notes?: [string, string][];
};

const ticketSeeds: TicketSeed[] = [
  { id: "SUP-001245", userId: "u-1001", subject: "Wallet funding not reflected", category: "wallet", priority: "high", status: "open", createdAt: "2026-10-04T10:12:00", related: { type: "transaction", id: "TXN-001302" }, message: "I funded my wallet but my balance has not changed." },
  { id: "SUP-001244", userId: "u-1004", subject: "Campaign delivery stopped halfway", category: "campaign", priority: "urgent", status: "in_progress", createdAt: "2026-10-04T09:30:00", related: { type: "campaign", id: "GP-2026-00314" }, message: "My campaign stopped delivering after about half the recipients. Please check what happened, I have a sale running this weekend.", replies: [["Thank you for reaching out. We are checking the delivery records for this campaign and will update you shortly.", "2026-10-04T10:05:00"]], notes: [["Carrier reported a temporary routing delay. Escalated to the delivery operations team.", "2026-10-04T10:20:00"]] },
  { id: "SUP-001243", userId: "u-1007", subject: "Referral bonus not credited", category: "referral", priority: "high", status: "in_progress", createdAt: "2026-10-03T15:40:00", related: { type: "referral", id: "REF-001833" }, message: "My friend signed up with my code and ran a campaign, but I can't see the referral bonus in my wallet.", replies: [["Thanks Tunde, we're confirming the referral qualification and the bonus credit now.", "2026-10-03T16:10:00"]] },
  { id: "SUP-001242", userId: "u-1002", subject: "Cannot reset account password", category: "account", priority: "normal", status: "pending_user", createdAt: "2026-10-03T11:05:00", message: "The password reset link says it has expired every time I open it.", replies: [["Sorry about that. We've sent a fresh reset link to your email. Could you try it within 15 minutes and let us know if it works?", "2026-10-03T11:40:00"]] },
  { id: "SUP-001241", userId: "u-1008", subject: "Audience rental charged twice", category: "audience", priority: "high", status: "open", createdAt: "2026-10-03T09:18:00", related: { type: "campaign", id: "GP-2026-00288" }, message: "I was charged twice for the same audience rental on my Holiday Greetings campaign." },
  { id: "SUP-001240", userId: "u-1006", subject: "Image campaign stuck in processing", category: "campaign", priority: "normal", status: "resolved", createdAt: "2026-10-02T14:22:00", related: { type: "campaign", id: "GP-2026-00240" }, message: "My image campaign has been in processing for hours.", replies: [["The image failed our size check. We've reprocessed it and delivery has resumed.", "2026-10-02T16:05:00"]] },
  { id: "SUP-001239", userId: "u-1003", subject: "Suspended account appeal", category: "account", priority: "urgent", status: "open", createdAt: "2026-10-02T10:47:00", message: "My account was suspended and I don't know why. I need access for my business campaigns." },
  { id: "SUP-001238", userId: "u-1009", subject: "Wallet balance mismatch", category: "wallet", priority: "high", status: "in_progress", createdAt: "2026-10-02T08:55:00", related: { type: "transaction", id: "TXN-001276" }, message: "My bank was debited ₦25,000 but the wallet shows the funding as failed.", replies: [["We've raised this with our payment provider and will confirm whether the payment was reversed.", "2026-10-02T09:30:00"]], notes: [["Provider reference PAY-92836102 shows a pending reversal. Follow up in 24h.", "2026-10-02T09:35:00"]] },
  { id: "SUP-001237", userId: "u-1005", subject: "Campaign not sending SMS", category: "technical", priority: "high", status: "pending_user", createdAt: "2026-10-01T16:30:00", related: { type: "campaign", id: "GP-2026-00302" }, message: "Recipients say they never got my SMS.", replies: [["Could you share two or three recipient numbers that didn't receive the message so we can trace them?", "2026-10-01T17:02:00"]] },
  { id: "SUP-001236", userId: "u-1010", subject: "Referral link not working", category: "referral", priority: "normal", status: "resolved", createdAt: "2026-10-01T12:15:00", message: "When people open my referral link it shows a blank page.", replies: [["This was caused by an app update and has been fixed. Your link works again.", "2026-10-01T15:48:00"]] },
  { id: "SUP-001235", userId: "u-1011", subject: "How do I download my invoice?", category: "account", priority: "low", status: "closed", createdAt: "2026-09-30T13:20:00", message: "I need an invoice for last month's campaigns for my accountant.", replies: [["You can download invoices from Wallet → Transactions → Download. Let us know if you need anything else.", "2026-09-30T14:00:00"]] },
  { id: "SUP-001234", userId: "u-1012", subject: "Account suspended without notice", category: "account", priority: "high", status: "resolved", createdAt: "2026-09-30T09:40:00", message: "My account was suspended without any notification.", replies: [["Your account was flagged for unusual activity. After review it has been restored.", "2026-09-30T12:15:00"]] },
  { id: "SUP-001233", userId: "u-1002", subject: "Audience export missing phone numbers", category: "audience", priority: "normal", status: "closed", createdAt: "2026-09-29T15:05:00", message: "The audience list I exported has some empty phone number cells.", replies: [["Those rows were opted-out contacts, which are excluded from exports. No action needed.", "2026-09-29T16:30:00"]] },
  { id: "SUP-001232", userId: "u-1001", subject: "Change business name on account", category: "account", priority: "low", status: "open", createdAt: "2026-09-29T10:10:00", message: "We rebranded. Can you update the business name on my account?" },
];

export const mockSupportTickets: SupportTicket[] = ticketSeeds.map(
  ({ message, replies = [], notes = [], ...ticket }) => {
    const userName = mockUsers.find((user) => user.id === ticket.userId)?.name ?? "Unknown user";
    const messages: TicketMessage[] = [
      { id: `${ticket.id}-m0`, author: "user", authorName: userName, body: message, createdAt: ticket.createdAt },
      ...replies.map(([body, createdAt], index): TicketMessage => ({
        id: `${ticket.id}-m${index + 1}`,
        author: "admin",
        authorName: SUPPORT_ADMIN,
        body,
        createdAt,
      })),
    ];
    const ticketNotes: TicketNote[] = notes.map(([body, createdAt], index) => ({
      id: `${ticket.id}-n${index}`,
      authorName: SUPPORT_ADMIN,
      body,
      createdAt,
    }));
    const times = [...messages, ...ticketNotes].map((item) => item.createdAt).sort();
    return { ...ticket, userName, messages, notes: ticketNotes, updatedAt: times[times.length - 1] };
  },
);

// ---- Notifications ----

/** Active app users an "All Users" announcement is delivered to. */
export const notificationAudienceSize = 24_580;

const toUser = (userId: string) => ({
  scope: "user" as const,
  userId,
  userName: mockUsers.find((user) => user.id === userId)?.name ?? "Unknown user",
});

const ALL_USERS = { scope: "all" as const };

export const mockNotifications: PlatformNotification[] = [
  { id: "NOT-001018", title: "Scheduled maintenance on October 12", message: "We will be performing scheduled maintenance on October 12 from 12:00 AM to 2:00 AM. Some services may be temporarily unavailable.", source: "admin", type: "announcement", status: "scheduled", recipient: ALL_USERS, createdAt: "2026-10-05T10:00:00", scheduledFor: "2026-10-12T00:00" },
  { id: "NOT-001017", title: "New: schedule your campaigns in advance", message: "You can now schedule SMS and image campaigns for a later date and time. Choose Schedule on the review screen to try it.", source: "admin", type: "announcement", status: "sent", recipient: ALL_USERS, createdAt: "2026-10-04T14:40:00", sentAt: "2026-10-04T15:00:00", recipients: 24_580, readCount: 18_940 },
  { id: "NOT-001016", title: "Wallet funding is now faster", message: "Wallet funding now confirms in seconds for card payments and within minutes for bank transfers.", source: "admin", type: "announcement", status: "sent", recipient: ALL_USERS, createdAt: "2026-10-02T11:20:00", sentAt: "2026-10-02T11:30:00", recipients: 24_580, readCount: 20_110 },
  { id: "NOT-001015", title: "Platform update on October 20", message: "A platform update on October 20 brings a refreshed campaign dashboard and faster delivery reports.", source: "admin", type: "announcement", status: "scheduled", recipient: ALL_USERS, createdAt: "2026-10-01T09:15:00", scheduledFor: "2026-10-20T09:00" },
  { id: "NOT-001007", title: "Refund credited", message: "₦5,375 has been refunded to your wallet for the audience rental on Brand Awareness Push.", source: "system", type: "wallet", status: "sent", recipient: toUser("u-1007"), createdAt: "2026-09-27T09:20:00", sentAt: "2026-09-27T09:20:00", related: { type: "transaction", id: "TXN-001306" } },
  { id: "NOT-001012", title: "Referral bonus credited", message: "You earned a ₦500 referral bonus. It has been added to your wallet.", source: "system", type: "referral", status: "sent", recipient: toUser("u-1006"), createdAt: "2026-09-27T16:30:00", sentAt: "2026-09-27T16:30:00", related: { type: "transaction", id: "TXN-001303" } },
  { id: "NOT-001004", title: "Referral bonus credited", message: "You earned a ₦500 referral bonus. It has been added to your wallet.", source: "system", type: "referral", status: "sent", recipient: toUser("u-1004"), createdAt: "2026-09-26T10:15:00", sentAt: "2026-09-26T10:15:00", related: { type: "transaction", id: "TXN-001304" } },
  { id: "NOT-001013", title: "Campaign completed", message: "Your campaign Summer Promo Blast has completed. 9,820 messages were delivered successfully.", source: "system", type: "campaign", status: "sent", recipient: toUser("u-1001"), createdAt: "2026-09-25T18:05:00", sentAt: "2026-09-25T18:05:00", related: { type: "campaign", id: "GP-2026-00321" } },
  { id: "NOT-001009", title: "Wallet funding failed", message: "Your wallet funding of ₦20,000 could not be completed. No money was taken. Please try again or use another payment method.", source: "system", type: "wallet", status: "sent", recipient: toUser("u-1002"), createdAt: "2026-09-25T11:25:00", sentAt: "2026-09-25T11:25:00" },
  { id: "NOT-001002", title: "Planned wallet maintenance (completed)", message: "Wallet funding will be unavailable on September 20 from 12:00 AM to 1:00 AM while we upgrade our payment systems.", source: "admin", type: "announcement", status: "cancelled", recipient: ALL_USERS, createdAt: "2026-09-15T14:00:00", scheduledFor: "2026-09-20T00:00" },
  { id: "NOT-001014", title: "Wallet funded", message: "₦1,500 has been added to your wallet.", source: "system", type: "wallet", status: "sent", recipient: toUser("u-1012"), createdAt: "2026-09-15T09:46:00", sentAt: "2026-09-15T09:46:00", related: { type: "transaction", id: "TXN-001269" } },
  { id: "NOT-001006", title: "Wallet funded", message: "₦40,000 has been added to your wallet.", source: "system", type: "wallet", status: "sent", recipient: toUser("u-1007"), createdAt: "2026-09-12T08:56:00", sentAt: "2026-09-12T08:56:00", related: { type: "transaction", id: "TXN-001266" } },
  { id: "NOT-001010", title: "Account suspended", message: "Your account has been suspended following a review. Contact support if you believe this is a mistake.", source: "system", type: "account", status: "sent", recipient: toUser("u-1008"), createdAt: "2026-09-12T08:30:00", sentAt: "2026-09-12T08:30:00" },
  { id: "NOT-001008", title: "Referral bonus failed", message: "We couldn't credit your ₦500 referral bonus. Our team is looking into it.", source: "system", type: "referral", status: "sent", recipient: toUser("u-1005"), createdAt: "2026-09-11T12:06:00", sentAt: "2026-09-11T12:06:00", related: { type: "transaction", id: "TXN-001265" } },
  { id: "NOT-001011", title: "Campaign failed", message: "Your campaign Loyalty Rewards could not be delivered to most recipients. Charges for failed messages will be refunded.", source: "system", type: "campaign", status: "sent", recipient: toUser("u-1003"), createdAt: "2026-09-09T10:00:00", sentAt: "2026-09-09T10:00:00", related: { type: "campaign", id: "GP-2026-00309" } },
  { id: "NOT-001005", title: "Campaign completed", message: "Your campaign Customer Appreciation has completed. 6,290 messages were delivered successfully.", source: "system", type: "campaign", status: "sent", recipient: toUser("u-1005"), createdAt: "2026-09-06T17:40:00", sentAt: "2026-09-06T17:40:00", related: { type: "campaign", id: "GP-2026-00302" } },
  { id: "NOT-001003", title: "Image campaigns are now available", message: "You can now send image campaigns alongside SMS. Create one from New Campaign → Image.", source: "admin", type: "announcement", status: "sent", recipient: ALL_USERS, createdAt: "2026-09-05T09:00:00", sentAt: "2026-09-05T10:00:00", recipients: 24_120, readCount: 22_870 },
  { id: "NOT-001001", title: "Welcome to the new Global Pride app", message: "Our new app is here, with a faster wallet, live delivery tracking and a redesigned campaign builder.", source: "admin", type: "announcement", status: "sent", recipient: ALL_USERS, createdAt: "2026-09-01T08:00:00", sentAt: "2026-09-01T09:00:00", recipients: 23_900, readCount: 23_410 },
];
