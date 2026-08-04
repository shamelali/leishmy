export { sendEmail } from "./brevo";
export type { EmailPayload } from "./brevo";
export { sendWelcomeEmail } from "./welcome";
export {
  sendBookingReceivedEmail,
  sendProviderNewBookingEmail,
  sendQuoteReadyEmail,
  sendQuoteRejectedEmail,
} from "./booking-confirmation";
export { sendPaymentReceiptEmail } from "./payment-receipt";
export { sendSubscriptionCreatedEmail } from "./subscription-created";
export { sendSubscriptionCanceledEmail } from "./subscription-canceled";
export { sendPayoutNotificationEmail } from "./payout-notification";
export {
  sendContactAckEmail,
  sendInquiryAckEmail,
  sendArtistOnboardingSubmittedEmail,
  sendAdminNewArtistNotification,
  sendLeadFollowUpEmail,
  sendInboundAckEmail,
} from "./acknowledgements";
export {
  sendWaitlistWelcomeEmail,
  sendBehindTheScenesEmail,
  sendLaunchReminderEmail,
} from "./waitlist";
export {
  bookingConfirmationTemplate,
  welcomeEmailTemplate,
  customerWelcomeTemplate,
  artistWelcomeTemplate,
  studioWelcomeTemplate,
  paymentReceiptTemplate,
  loyaltyPointsEarnedTemplate,
  providerNewBookingTemplate,
  subscriptionCreatedTemplate,
  subscriptionCanceledTemplate,
  notificationEmailTemplate,
  payoutNotificationTemplate,
} from "./templates";
