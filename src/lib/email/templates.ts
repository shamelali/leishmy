export function bookingConfirmationTemplate(params: {
  customerName: string;
  bookingId: string;
  serviceName: string;
  providerName: string;
  date: string;
  time: string;
  amount: number;
  paymentType: "full" | "deposit";
  travelSurcharge?: number;
  accommodationFee?: number;
}) {
  const subject = `Booking Received - ${params.bookingId}`;

  const travelSurcharge = params.travelSurcharge || 0;
  const accommodationFee = params.accommodationFee || 0;
  const serviceAmount = params.amount - travelSurcharge - accommodationFee;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Booking Received</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a1a; color: white; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #c9a96e; }
    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
    .detail-row.total { border-bottom: 2px solid #c9a96e; font-weight: bold; font-size: 16px; }
    .detail-row.fee { color: #e57373; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .button { display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Booking Received</h1>
    <p>Please complete your payment to confirm.</p>
  </div>
  <div class="content">
    <p>Hi ${params.customerName},</p>
    <p>Thank you for booking with Leish. Your booking request has been received. Please complete your payment to confirm the appointment.</p>
    <div class="details">
      <h3>Booking Details</h3>
      <div class="detail-row"><span>Reference:</span><strong>${params.bookingId}</strong></div>
      <div class="detail-row"><span>Service:</span><strong>${params.serviceName}</strong></div>
      <div class="detail-row"><span>Provider:</span><strong>${params.providerName}</strong></div>
      <div class="detail-row"><span>Date:</span><strong>${params.date}</strong></div>
      <div class="detail-row"><span>Time:</span><strong>${params.time}</strong></div>
      <div class="detail-row"><span>Service Fee:</span><strong>MYR ${serviceAmount}</strong></div>
      ${travelSurcharge > 0 ? `<div class="detail-row fee"><span>Travel Surcharge:</span><strong>+ MYR ${travelSurcharge}</strong></div>` : ''}
      ${accommodationFee > 0 ? `<div class="detail-row fee"><span>Accommodation:</span><strong>+ MYR ${accommodationFee}</strong></div>` : ''}
      <div class="detail-row total"><span>Total (starts from):</span><strong>MYR ${params.amount}</strong></div>
    </div>
    <p style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/bookings" class="button">View My Bookings</a>
    </p>
  </div>
  <div style="background: #fefce8; padding: 20px; margin: 0 0 20px 0; border-radius: 8px; text-align: center;">
    <p style="font-weight: bold; margin: 0 0 4px 0;">🎉 Loved your session?</p>
    <p style="margin: 0; font-size: 14px; color: #555;">Share this artist with friends and earn 200 loyalty points!</p>
    <a href="${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/dashboard/artist/share" style="display: inline-block; background: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px; margin-top: 10px;">Learn More</a>
  </div>
  <div class="footer">
    <p>If you need to reschedule or cancel, please contact us at hello@leish.my</p>
    <p><a href="${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/terms" style="color: #666;">Terms & Conditions</a></p>
    <p>&copy; 2026 Leish. All rights reserved.</p>
  </div>
</body>
</html>`;

  const text = `
Booking Received - ${params.bookingId}

Hi ${params.customerName},

Thank you for booking with Leish. Your booking request has been received. Please complete your payment to confirm the appointment.

BOOKING DETAILS:
- Reference: ${params.bookingId}
- Service: ${params.serviceName}
- Provider: ${params.providerName}
- Date: ${params.date}
- Time: ${params.time}
- Amount: MYR ${params.amount} (Pending Payment)

View your bookings: ${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/bookings

🎉 LOVED YOUR SESSION? Share this artist with friends and earn 200 loyalty points!
${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/dashboard/artist/share

If you need to reschedule or cancel, please contact us at hello@leish.my
Terms & Conditions: ${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/terms

&copy; 2026 Leish. All rights reserved.`;

  return { subject, html, text };
}

const LEISH_BASE_URL = () => process.env.NEXT_PUBLIC_URL || "https://leish.my";

type WelcomeStep = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
};

type WelcomeResource = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
};

function buildWelcomeHtml(params: {
  name: string;
  heroTitle: string;
  intro: string;
  steps: WelcomeStep[];
  resources: WelcomeResource[];
  closing: string;
}) {
  const base = LEISH_BASE_URL();

  const stepsHtml = params.steps
    .map(
      (step, i) => `
    <div class="step">
      <p class="step-head"><span class="step-num">${i + 1}</span><strong>${step.title}</strong></p>
      <p class="step-desc">${step.description}</p>
      <a href="${step.ctaUrl}" class="button">${step.ctaLabel}</a>
    </div>`,
    )
    .join("");

  const resourcesHtml = params.resources
    .map(
      (resource) => `
    <div class="resource">
      <p class="resource-title">${resource.title}</p>
      <p class="resource-desc">${resource.description}</p>
      <a href="${resource.ctaUrl}" class="link">${resource.ctaLabel}</a>
    </div>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${params.heroTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a1a; color: white; padding: 30px; text-align: center; }
    .brand { color: #c9a96e; font-size: 20px; font-weight: bold; letter-spacing: 2px; margin-bottom: 8px; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .section-title { font-weight: bold; font-size: 16px; margin: 28px 0 12px; color: #1a1a1a; }
    .step { background: white; padding: 18px; margin: 12px 0; border-radius: 10px; border-left: 4px solid #c9a96e; }
    .step-head { margin: 0 0 6px; }
    .step-num { display: inline-block; background: #1a1a1a; color: #c9a96e; font-weight: bold; width: 26px; height: 26px; line-height: 26px; text-align: center; border-radius: 50%; margin-right: 8px; font-size: 14px; }
    .step-desc { margin: 0 0 10px; font-size: 14px; color: #555; }
    .button { display: inline-block; background: #1a1a1a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px; }
    .resource { background: white; padding: 16px; margin: 10px 0; border-radius: 10px; }
    .resource-title { margin: 0 0 4px; font-weight: bold; }
    .resource-desc { margin: 0 0 8px; font-size: 14px; color: #555; }
    .link { color: #c9a96e; font-weight: bold; text-decoration: none; font-size: 14px; }
    .contact { background: white; padding: 16px; margin: 10px 0; border-radius: 10px; }
    .contact a { color: #7c3aed; text-decoration: none; font-weight: bold; }
    .closing { margin-top: 24px; }
    .signature { font-weight: bold; color: #1a1a1a; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">LEISH.MY</div>
    <h1 style="margin: 0;">${params.heroTitle}</h1>
  </div>
  <div class="content">
    <p>Hi ${params.name},</p>
    <p>${params.intro}</p>
    <p class="section-title">To make the most of it, here are three quick steps to get you started.</p>
    ${stepsHtml}
    <p class="section-title">Resources</p>
    ${resourcesHtml}
    <div class="contact">
      <p style="margin: 0 0 6px;"><strong>Stay connected</strong></p>
      <p style="margin: 0; font-size: 14px; color: #555;">
        <a href="https://www.instagram.com/leish.my">Instagram @leish.my</a> &middot;
        <a href="https://wa.me/601137633788">WhatsApp</a> &middot;
        <a href="mailto:hello@leish.my">hello@leish.my</a>
      </p>
    </div>
    <p class="closing">${params.closing}</p>
    <p class="signature">Team LEISH.MY</p>
  </div>
  <div class="footer">
    <p>&copy; 2026 Leish. All rights reserved.</p>
    <p><a href="${base}/terms" style="color: #666;">Terms &amp; Conditions</a></p>
  </div>
</body>
</html>`;
}

function buildWelcomeText(params: {
  subject: string;
  name: string;
  intro: string;
  steps: WelcomeStep[];
  resources: WelcomeResource[];
  closing: string;
}) {
  const stepsText = params.steps
    .map(
      (step, i) => `
${i + 1}. ${step.title}
${step.description}
${step.ctaLabel}: ${step.ctaUrl}`,
    )
    .join("\n");

  const resourcesText = params.resources
    .map(
      (resource) => `
${resource.title}
${resource.description}
${resource.ctaLabel}: ${resource.ctaUrl}`,
    )
    .join("\n");

  return `
${params.subject}

Hi ${params.name},

${params.intro}

TO MAKE THE MOST OF IT, HERE ARE THREE QUICK STEPS TO GET YOU STARTED:${stepsText}

RESOURCES:${resourcesText}

STAY CONNECTED
Instagram: https://www.instagram.com/leish.my
WhatsApp: https://wa.me/601137633788
Email: hello@leish.my

${params.closing}

Team LEISH.MY

&copy; 2026 Leish. All rights reserved.`;
}

export function customerWelcomeTemplate(params: { name: string }) {
  const subject = "Welcome to Leish! Let's get you started";
  const heroTitle = "Welcome to Leish! Let's get you started.";
  const intro =
    "You've just joined Malaysia's finest beauty marketplace. From glam to bridal, find and book the perfect makeup artist or studio for any occasion.";
  const steps: WelcomeStep[] = [
    {
      title: "Set up your profile",
      description:
        "Add your name, preferences and location so we can match you with artists you'll love.",
      ctaLabel: "Set up your profile",
      ctaUrl: `${LEISH_BASE_URL()}/profile`,
    },
    {
      title: "Find your perfect artist",
      description:
        "Browse Malaysia's top makeup artists and studios by category, and save your favorites.",
      ctaLabel: "Explore artists",
      ctaUrl: `${LEISH_BASE_URL()}/artists`,
    },
    {
      title: "Book & earn rewards",
      description: "Book your look in a few clicks and earn loyalty points on every session.",
      ctaLabel: "See your rewards",
      ctaUrl: `${LEISH_BASE_URL()}/rewards`,
    },
  ];
  const resources: WelcomeResource[] = [
    {
      title: "Community",
      description:
        "Join the conversation on Instagram @leish.my and WhatsApp — share looks, ask questions and get beauty tips.",
      ctaLabel: "Join discussions",
      ctaUrl: "https://www.instagram.com/leish.my",
    },
    {
      title: "Help center",
      description: "Our FAQ and support pages cover everything from bookings to payments.",
      ctaLabel: "Visit help pages",
      ctaUrl: `${LEISH_BASE_URL()}/faq`,
    },
  ];
  const closing = "Happy booking!";

  return {
    subject,
    html: buildWelcomeHtml({ name: params.name, heroTitle, intro, steps, resources, closing }),
    text: buildWelcomeText({ subject, name: params.name, intro, steps, resources, closing }),
  };
}

export function artistWelcomeTemplate(params: { name: string }) {
  const subject = "Welcome to the Leish! Elite Network";
  const heroTitle = "Welcome to the Leish! Elite Network";
  const intro =
    "You've just joined Malaysia's premier beauty marketplace. Your profile is now live — let's get it ready to bring in bookings.";
  const steps: WelcomeStep[] = [
    {
      title: "Complete your profile",
      description:
        "Add your portfolio, bio, services and pricing. Profiles with clear pricing get more bookings.",
      ctaLabel: "Complete your profile",
      ctaUrl: `${LEISH_BASE_URL()}/dashboard/artist`,
    },
    {
      title: "Get ready to book",
      description:
        "Sync your calendar, set your availability and accept bookings in real time.",
      ctaLabel: "Manage your bookings",
      ctaUrl: `${LEISH_BASE_URL()}/bookings`,
    },
    {
      title: "Share & grow",
      description:
        "Share your profile link with clients and earn 200 loyalty points when they book through your link.",
      ctaLabel: "Get your share link",
      ctaUrl: `${LEISH_BASE_URL()}/dashboard/artist/share`,
    },
  ];
  const resources: WelcomeResource[] = [
    {
      title: "Community",
      description:
        "Join the exclusive MUA community and follow @leish.my — we feature our artists.",
      ctaLabel: "Join discussions",
      ctaUrl: "https://www.instagram.com/leish.my",
    },
    {
      title: "Help center",
      description:
        "Read the Artist Onboarding guide — a step-by-step playbook to a world-class profile.",
      ctaLabel: "Read the onboarding guide",
      ctaUrl: `${LEISH_BASE_URL()}/artist-onboarding`,
    },
  ];
  const closing = "Let's get you booked!";

  return {
    subject,
    html: buildWelcomeHtml({ name: params.name, heroTitle, intro, steps, resources, closing }),
    text: buildWelcomeText({ subject, name: params.name, intro, steps, resources, closing }),
  };
}

export function studioWelcomeTemplate(params: { name: string }) {
  const subject = "Welcome to the Leish! Studio Network";
  const heroTitle = "Welcome to the Leish! Studio Network";
  const intro =
    "Thank you for registering your studio on Leish! Your listing is being reviewed. Here's how to set your studio up for success.";
  const steps: WelcomeStep[] = [
    {
      title: "Set up your studio",
      description:
        "Add your listing, services, staff and pricing so clients know exactly what you offer.",
      ctaLabel: "Edit your studio profile",
      ctaUrl: `${LEISH_BASE_URL()}/dashboard/studio/edit`,
    },
    {
      title: "Manage your operations",
      description:
        "Keep your calendar, inventory and finances in one place — all from your studio dashboard.",
      ctaLabel: "Open your dashboard",
      ctaUrl: `${LEISH_BASE_URL()}/dashboard/studio`,
    },
    {
      title: "Grow your business",
      description:
        "Share your studio link and earn 200 loyalty points when new clients book through your link.",
      ctaLabel: "Get your share link",
      ctaUrl: `${LEISH_BASE_URL()}/dashboard/studio/share`,
    },
  ];
  const resources: WelcomeResource[] = [
    {
      title: "Community",
      description:
        "Join the conversation on Instagram @leish.my and WhatsApp — connect with Malaysia's beauty industry.",
      ctaLabel: "Join discussions",
      ctaUrl: "https://www.instagram.com/leish.my",
    },
    {
      title: "Help center",
      description: "Our FAQ and support pages cover everything from bookings to payouts.",
      ctaLabel: "Visit help pages",
      ctaUrl: `${LEISH_BASE_URL()}/faq`,
    },
  ];
  const closing = "Let's grow your studio!";

  return {
    subject,
    html: buildWelcomeHtml({ name: params.name, heroTitle, intro, steps, resources, closing }),
    text: buildWelcomeText({ subject, name: params.name, intro, steps, resources, closing }),
  };
}

export function welcomeEmailTemplate(params: { name: string; role?: string }) {
  if (params.role === "artist") return artistWelcomeTemplate({ name: params.name });
  if (params.role === "studio") return studioWelcomeTemplate({ name: params.name });
  return customerWelcomeTemplate({ name: params.name });
}

export function paymentReceiptTemplate(params: {
  customerName: string;
  bookingId: string;
  amount: number;
  paymentMethod: string;
  date: string;
}) {
  const amountStr = (params.amount / 100).toLocaleString();
  const subject = `Payment Receipt - ${params.bookingId}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a1a; color: white; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .receipt { background: white; padding: 20px; margin: 20px 0; }
    .amount { font-size: 32px; color: #c9a96e; text-align: center; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header"><h1>Payment Receipt</h1></div>
  <div class="content">
    <p>Hi ${params.customerName},</p>
    <p>Thank you for your payment. Here's your receipt.</p>
    <div class="receipt">
      <div class="amount">MYR ${amountStr}</div>
      <p style="text-align: center; color: #666;">Paid on ${params.date}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p><strong>Booking Reference:</strong> ${params.bookingId}</p>
      <p><strong>Payment Method:</strong> ${params.paymentMethod}</p>
    </div>
  </div>
  <div class="footer">
    <p>&copy; 2026 Leish. All rights reserved.</p>
  </div>
</body>
</html>`;
  const text = `Payment Receipt - ${params.bookingId}\n\nHi ${params.customerName},\n\nThank you for your payment. Here's your receipt.\n\nAmount: MYR ${amountStr}\nPaid on: ${params.date}\nBooking Reference: ${params.bookingId}\nPayment Method: ${params.paymentMethod}\n\n&copy; 2026 Leish. All rights reserved.`;
  return { subject, html, text };
}

export function notificationEmailTemplate(params: {
  name: string;
  title: string;
  body: string;
  type: string;
}) {
  const subject = params.title;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${params.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a1a; color: white; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .button { display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
    .tag { display: inline-block; background: #c9a96e; color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="header">
    <span class="tag">${params.type}</span>
    <h1>${params.title}</h1>
  </div>
  <div class="content">
    <p>Hi ${params.name},</p>
    <p>${params.body}</p>
    <p style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/account" class="button">View in Account</a>
    </p>
  </div>
  <div class="footer">
    <p>&copy; 2026 Leish. All rights reserved.</p>
  </div>
</body>
</html>`;
  const text = `${params.title}\n\nHi ${params.name},\n\n${params.body}\n\nView in your account: ${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/account\n\n&copy; 2026 Leish. All rights reserved.`;
  return { subject, html, text };
}

export function loyaltyPointsEarnedTemplate(params: {
  customerName: string;
  bookingId: string;
  pointsEarned: number;
  currentBalance: number;
  tier: string;
}) {
  const tierEmoji: Record<string, string> = { bronze: "\u{1F949}", silver: "\u{1F948}", gold: "\u{1F947}", platinum: "\u{1F48E}" };
  const emoji = tierEmoji[params.tier] || "\u{1F3C6}";
  const subject = `${emoji} You earned ${params.pointsEarned} points!`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Points Earned</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #c9a96e 0%, #d4b896 100%); color: white; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .points-card { background: white; padding: 30px; text-align: center; margin: 20px 0; border-radius: 12px; }
    .points-value { font-size: 48px; font-weight: bold; color: #c9a96e; }
    .tier-badge { display: inline-block; background: #1a1a1a; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; }
    .balance { font-size: 24px; margin-top: 10px; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header"><h1>${emoji} Points Earned!</h1></div>
  <div class="content">
    <p>Hi ${params.customerName},</p>
    <p>Great news! You've earned points from your recent booking.</p>
    <div class="points-card">
      <div class="points-value">+${params.pointsEarned}</div>
      <p>Points Earned</p>
      <div class="tier-badge">${params.tier.charAt(0).toUpperCase() + params.tier.slice(1)} Member</div>
      <div class="balance">Balance: ${params.currentBalance} points</div>
    </div>
    <p>Keep booking to earn more points and unlock exclusive benefits!</p>
  </div>
  <div class="footer"><p>&copy; 2026 Leish. All rights reserved.</p></div>
</body>
</html>`;
  const text = `Points Earned - ${params.bookingId}\n\nHi ${params.customerName},\n\nYou've earned ${params.pointsEarned} points from your recent booking!\n\nBalance: ${params.currentBalance} points\nTier: ${params.tier.charAt(0).toUpperCase() + params.tier.slice(1)} Member\n\nKeep booking to earn more points and unlock exclusive benefits!\n\n&copy; 2026 Leish. All rights reserved.`;
  return { subject, html, text };
}

export function providerNewBookingTemplate(params: {
  providerName: string;
  customerName: string;
  bookingId: string;
  serviceName: string;
  date: string;
  time: string;
  travelSurcharge?: number;
  accommodationFee?: number;
  totalPrice?: number;
  depositAmount?: number;
  depositPercent?: number;
}) {
  const subject = `New Booking Received - ${params.bookingId}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Booking Received</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #059669; color: white; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #059669; }
    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .button { display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header"><h1>New Booking!</h1></div>
  <div class="content">
    <p>Hi ${params.providerName},</p>
    <p>You've received a new booking from <strong>${params.customerName}</strong>.</p>
    <div class="details">
      <h3>Booking Details</h3>
      <div class="detail-row"><span>Reference:</span><strong>${params.bookingId}</strong></div>
      <div class="detail-row"><span>Service:</span><strong>${params.serviceName}</strong></div>
      <div class="detail-row"><span>Date:</span><strong>${params.date}</strong></div>
      <div class="detail-row"><span>Time:</span><strong>${params.time}</strong></div>
      ${params.totalPrice ? `<div class="detail-row"><span>Total Price:</span><strong>MYR ${params.totalPrice.toFixed(2)}</strong></div>` : ""}
      ${params.depositAmount ? `<div class="detail-row"><span>Deposit (${params.depositPercent || 30}%):</span><strong>MYR ${params.depositAmount.toFixed(2)}</strong></div>` : ""}
    </div>
    <p style="text-align: center;"><a href="${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/dashboard/artist" class="button">View Booking</a></p>
  </div>
  <div class="footer"><p>&copy; 2026 Leish. All rights reserved.</p></div>
</body>
</html>`;
  const text = `New Booking Received - ${params.bookingId}\n\nHi ${params.providerName},\n\nYou've received a new booking from ${params.customerName}.\n\nBOOKING DETAILS:\n- Reference: ${params.bookingId}\n- Service: ${params.serviceName}\n- Date: ${params.date}\n- Time: ${params.time}${params.totalPrice ? `\n- Total Price: MYR ${params.totalPrice.toFixed(2)}` : ""}${params.depositAmount ? `\n- Deposit (${params.depositPercent || 30}%): MYR ${params.depositAmount.toFixed(2)}` : ""}\n\nView Booking: ${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/dashboard/artist\n\n&copy; 2026 Leish. All rights reserved.`;
  return { subject, html, text };
}

export function subscriptionCreatedTemplate(params: {
  customerName: string;
  planName: string;
  amount: number;
}) {
  const subject = `Pro Subscription Activated - ${params.planName}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Pro Subscription Activated</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #c9a96e 0%, #d4b896 100%); color: white; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .plan-card { background: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 12px; }
    .plan-name { font-size: 28px; font-weight: bold; color: #c9a96e; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .button { display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header"><h1>Welcome to Pro!</h1></div>
  <div class="content">
    <p>Hi ${params.customerName},</p>
    <p>Your Pro subscription has been activated!</p>
    <div class="plan-card"><div class="plan-name">${params.planName}</div><p>MYR ${params.amount}/month</p></div>
    <p>You now have access to all Pro features including priority listing, advanced analytics, and more.</p>
    <p style="text-align: center;"><a href="${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/account" class="button">View Account</a></p>
  </div>
  <div class="footer"><p>If you have questions, contact us at hello@leish.my</p><p>&copy; 2026 Leish. All rights reserved.</p></div>
</body>
</html>`;
  const text = `Pro Subscription Activated - ${params.planName}\n\nHi ${params.customerName},\n\nYour Pro subscription has been activated!\n\nPlan: ${params.planName}\nAmount: MYR ${params.amount}/month\n\nYou now have access to all Pro features.\n\nView Account: ${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/account\n\nContact us at hello@leish.my if you have questions.\n\n&copy; 2026 Leish. All rights reserved.`;
  return { subject, html, text };
}

export function subscriptionCanceledTemplate(params: {
  customerName: string;
  planName: string;
  cancelDate: string;
}) {
  const subject = `Pro Subscription Canceled`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Pro Subscription Canceled</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6b7280; color: white; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .button { display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header"><h1>Subscription Canceled</h1></div>
  <div class="content">
    <p>Hi ${params.customerName},</p>
    <p>Your <strong>${params.planName}</strong> subscription has been canceled and will not renew.</p>
    <p>Your Pro benefits will remain active until <strong>${params.cancelDate}</strong>.</p>
    <p style="text-align: center;"><a href="${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/pro/upgrade" class="button">Resubscribe</a></p>
  </div>
  <div class="footer"><p>If you have questions, contact us at hello@leish.my</p><p>&copy; 2026 Leish. All rights reserved.</p></div>
</body>
</html>`;
  const text = `Subscription Canceled\n\nHi ${params.customerName},\n\nYour ${params.planName} subscription has been canceled and will not renew.\n\nYour Pro benefits will remain active until ${params.cancelDate}.\n\nResubscribe: ${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/pro/upgrade\n\nContact us at hello@leish.my if you have questions.\n\n&copy; 2026 Leish. All rights reserved.`;
  return { subject, html, text };
}

export function payoutNotificationTemplate(params: {
  name: string;
  amount: number;
  date: string;
}) {
  const subject = "Your Payout from Leish Has Been Processed";
  const amountStr = (params.amount / 100).toLocaleString();
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payout Processed</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #059669; color: white; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .amount { font-size: 32px; color: #059669; text-align: center; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header"><h1>Payout Processed</h1></div>
  <div class="content">
    <p>Hi ${params.name},</p>
    <p>Your payout has been processed successfully.</p>
    <div class="amount">MYR ${amountStr}</div>
    <p style="text-align: center; color: #666;">Processed on ${params.date}</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p>The funds should reflect in your bank account within <strong>1-3 business days</strong>.</p>
    <p>If you have any questions, please contact us at hello@leish.my</p>
  </div>
  <div class="footer">
    <p>&copy; 2026 Leish. All rights reserved.</p>
  </div>
</body>
</html>`;
  const text = `Your Payout from Leish Has Been Processed\n\nHi ${params.name},\n\nYour payout has been processed successfully.\n\nAmount: MYR ${amountStr}\nProcessed on: ${params.date}\n\nThe funds should reflect in your bank account within 1-3 business days.\n\nIf you have any questions, please contact us at hello@leish.my\n\n&copy; 2026 Leish. All rights reserved.`;
  return { subject, html, text };
}

export function bookingCompletedTemplate(params: {
  customerName: string;
  bookingId: string;
  serviceName: string;
  providerName: string;
  reviewUrl: string;
}) {
  const subject = `Your Booking is Complete! - ${params.bookingId}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Booking Complete</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #059669; color: white; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #059669; }
    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .button { display: inline-block; background: #c9a96e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Service Complete!</h1>
    <p>Thank you for choosing ${params.providerName}</p>
  </div>
  <div class="content">
    <p>Hi ${params.customerName},</p>
    <p>Your service has been completed. We hope you had a wonderful experience!</p>
    <div class="details">
      <h3>Booking Details</h3>
      <div class="detail-row"><span>Reference:</span><strong>${params.bookingId}</strong></div>
      <div class="detail-row"><span>Service:</span><strong>${params.serviceName}</strong></div>
      <div class="detail-row"><span>Provider:</span><strong>${params.providerName}</strong></div>
    </div>
    <p style="text-align: center; margin-top: 20px;">
      <a href="${params.reviewUrl}" class="button">Leave a Review</a>
    </p>
    <p style="text-align: center; color: #666; font-size: 13px; margin-top: 10px;">
      Your feedback helps other customers find great providers
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p>If you have any questions, please contact us at hello@leish.my</p>
  </div>
  <div class="footer">
    <p>&copy; 2026 Leish. All rights reserved.</p>
  </div>
</body>
</html>`;

  const text = `Your Booking is Complete!\n\nHi ${params.customerName},\n\nYour service has been completed. We hope you had a wonderful experience!\n\nBooking Details:\nReference: ${params.bookingId}\nService: ${params.serviceName}\nProvider: ${params.providerName}\n\nLeave a review: ${params.reviewUrl}\n\nYour feedback helps other customers find great providers.\n\nIf you have any questions, please contact us at hello@leish.my\n\n© 2026 Leish. All rights reserved.`;

  return { subject, html, text };
}
