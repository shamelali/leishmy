export { sendEmail } from "./brevo";
export type { EmailPayload } from "./brevo";
export { sendWelcomeEmail } from "./welcome";
export {
  sendBookingConfirmationEmail,
  sendProviderNewBookingEmail,
} from "./booking-confirmation";
export { sendPaymentReceiptEmail } from "./payment-receipt";
export {
  bookingConfirmationTemplate,
  bookingReminderTemplate,
  bookingExpiredTemplate,
  bookingAutoCanceledTemplate,
  welcomeEmailTemplate,
  paymentReceiptTemplate,
  loyaltyPointsEarnedTemplate,
  providerNewBookingTemplate,
  subscriptionCreatedTemplate,
  subscriptionCanceledTemplate,
  notificationEmailTemplate,
} from "./templates";
