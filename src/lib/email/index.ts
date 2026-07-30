export { sendEmail } from "./brevo";
export type { EmailPayload } from "./brevo";
export { sendWelcomeEmail } from "./welcome";
export {
  sendBookingReceivedEmail,
  sendProviderNewBookingEmail,
  sendQuoteReadyEmail,
} from "./booking-confirmation";
export { sendPaymentReceiptEmail } from "./payment-receipt";
export { sendSubscriptionCreatedEmail } from "./subscription-created";
export { sendSubscriptionCanceledEmail } from "./subscription-canceled";
export { sendPayoutNotificationEmail } from "./payout-notification";
export {
  bookingConfirmationTemplate,
  welcomeEmailTemplate,
  paymentReceiptTemplate,
  loyaltyPointsEarnedTemplate,
  providerNewBookingTemplate,
  subscriptionCreatedTemplate,
  subscriptionCanceledTemplate,
  notificationEmailTemplate,
  payoutNotificationTemplate,
} from "./templates";
