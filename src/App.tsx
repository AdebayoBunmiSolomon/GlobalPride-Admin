import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import RequireAuth from "./routes/RequireAuth";
import {
  AccountSettings,
  AdvertisementDetails,
  Advertisements,
  AudienceLgas,
  AudienceMarketplace,
  AudienceRecordDetails,
  AudienceStates,
  AuditLogs,
  CampaignCompliance,
  CampaignDetails,
  CampaignRecipients,
  Campaigns,
  ContentReports,
  CreateAdvertisement,
  CreateFaq,
  CreateHelpArticle,
  CreateNotification,
  Dashboard,
  DisclaimerLogs,
  EditAdvertisement,
  EditFaq,
  EditHelpArticle,
  EditNotification,
  Faqs,
  Finance,
  FinanceReport,
  FlagDetails,
  FlaggedActivities,
  GeneralSettings,
  HelpArticles,
  Login,
  NotFound,
  NotificationSettings,
  NotificationDetails,
  Notifications,
  PlatformInformation,
  Pricing,
  Profile,
  ReferralDetails,
  Referrals,
  SecuritySettings,
  SupportTickets,
  TicketDetails,
  Promotions,
  UserActivity,
  UserActivityLogs,
  UserDetails,
  Users,
  WalletTransactionDetails,
  Wallets,
} from "./pages";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/account-settings" element={<AccountSettings />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/:userId" element={<UserDetails />} />
          <Route path="/users/:userId/activity" element={<UserActivity />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaigns/:campaignId" element={<CampaignDetails />} />
          <Route path="/campaigns/:campaignId/recipients" element={<CampaignRecipients />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/pricing/promotions" element={<Promotions />} />
          <Route path="/audience-marketplace" element={<AudienceMarketplace />} />
          <Route path="/audience-marketplace/records/:recordId" element={<AudienceRecordDetails />} />
          <Route path="/audience-marketplace/states" element={<AudienceStates />} />
          <Route path="/audience-marketplace/states/:stateId/lgas" element={<AudienceLgas />} />
          <Route path="/audience-marketplace/lgas" element={<AudienceLgas />} />
          <Route path="/wallets" element={<Wallets />} />
          <Route path="/wallets/transactions/:transactionId" element={<WalletTransactionDetails />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/finance/reports/:reportId" element={<FinanceReport />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/referrals/:referralId" element={<ReferralDetails />} />
          <Route path="/advertisements" element={<Advertisements />} />
          <Route path="/advertisements/new" element={<CreateAdvertisement />} />
          <Route path="/advertisements/:advertisementId" element={<AdvertisementDetails />} />
          <Route path="/advertisements/:advertisementId/edit" element={<EditAdvertisement />} />
          <Route path="/support" element={<SupportTickets />} />
          <Route path="/support/tickets/:ticketId" element={<TicketDetails />} />
          <Route path="/support/articles" element={<HelpArticles />} />
          <Route path="/support/articles/new" element={<CreateHelpArticle />} />
          <Route path="/support/articles/:contentId/edit" element={<EditHelpArticle />} />
          <Route path="/support/faqs" element={<Faqs />} />
          <Route path="/support/faqs/new" element={<CreateFaq />} />
          <Route path="/support/faqs/:contentId/edit" element={<EditFaq />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/notifications/new" element={<CreateNotification />} />
          <Route path="/notifications/:notificationId" element={<NotificationDetails />} />
          <Route path="/notifications/:notificationId/edit" element={<EditNotification />} />
          <Route path="/compliance" element={<FlaggedActivities />} />
          <Route path="/compliance/flagged-activities" element={<Navigate to="/compliance" replace />} />
          <Route path="/compliance/flags/:flagId" element={<FlagDetails />} />
          <Route path="/compliance/content-reports" element={<ContentReports />} />
          <Route path="/compliance/campaigns" element={<CampaignCompliance />} />
          <Route path="/compliance/user-activity" element={<UserActivityLogs />} />
          <Route path="/compliance/audit-logs" element={<AuditLogs />} />
          <Route path="/compliance/disclaimers" element={<DisclaimerLogs />} />
          <Route path="/settings" element={<GeneralSettings />} />
          <Route path="/settings/notifications" element={<NotificationSettings />} />
          <Route path="/settings/security" element={<SecuritySettings />} />
          <Route path="/settings/platform" element={<PlatformInformation />} />
          {/* other protected routes go here too */}
        </Route>
      </Route>
      <Route path="/home" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
