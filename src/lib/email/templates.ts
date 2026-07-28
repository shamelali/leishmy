export function bookingConfirmationTemplate(params: {
  customerName: string;
  bookingId: string;
  serviceName: string;
  providerName: string;
  date: string;
  time: string;
  amount: number;
  paymentType: "full" | "deposit";
}) {
  const subject = `Booking Received - ${params.bookingId}`;

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
      <div class="detail-row"><span>Amount:</span><strong>MYR ${params.amount} (Pending Payment)</strong></div>
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

&copy; 2026 Leish. All rights reserved.`;

  return { subject, html, text };
}

export function welcomeEmailTemplate(params: { name: string; role?: string }) {
  const subject =
    params.role === "artist"
      ? "Welcome to Leish! Artist Network"
      : params.role === "studio"
        ? "Your Studio Registration on Leish!"
        : "Welcome to Leish!";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Leish</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a1a; color: white; padding: 30px; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .button { display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header"><h1>Welcome to Leish</h1></div>
  <div class="content">
    <p>Hi ${params.name},</p>
    ${
      params.role === "artist"
        ? `<p>Thank you for joining Leish! As an artist, your profile is now live. Start receiving bookings!</p>`
        : params.role === "studio"
          ? `<p>Thank you for registering your studio on Leish! Your studio listing is being reviewed.</p>`
          : `<p>Welcome to Leish! We're thrilled to have you join our platform.</p>`
    }
    <p>Discover top makeup artists, book appointments, and find your perfect look.</p>
    ${
      params.role === "artist" || params.role === "studio"
        ? `<div style="background: #f3e8ff; padding: 20px; margin: 20px 0; border-radius: 8px;">
             <p style="font-weight: bold; margin: 0 0 8px 0;">💰 Earn 200 points per referral</p>
             <p style="margin: 0 0 12px 0; font-size: 14px; color: #555;">Share your profile link with clients and earn 200 loyalty points when they book through your link.</p>
             <a href="${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/dashboard/${params.role}/share" style="display: inline-block; background: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px;">Get Your Share Link</a>
           </div>`
        : ""
    }
    <p style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/artists" class="button">Explore Artists</a>
    </p>
  </div>
  <div class="footer">
    <p>&copy; 2026 Leish. All rights reserved.</p>
  </div>
</body>
</html>`;

  const text = `
${subject}

Hi ${params.name},

${
  params.role === "artist"
    ? "Thank you for joining Leish! As an artist, your profile is now live. Start receiving bookings!"
    : params.role === "studio"
      ? "Thank you for registering your studio on Leish! Your studio listing is being reviewed."
      : "Welcome to Leish! We're thrilled to have you join our platform."
}

Discover top makeup artists, book appointments, and find your perfect look.

${
  params.role === "artist" || params.role === "studio"
    ? `\nEARN 200 POINTS PER REFERRAL\nShare your profile link with clients and earn 200 loyalty points when they book through you.\nGet your share link: ${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/dashboard/${params.role}/share\n`
    : ""
}

Explore Artists: ${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/artists

&copy; 2026 Leish. All rights reserved.`;

  return { subject, html, text };
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
    </div>
    <p style="text-align: center;"><a href="${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/dashboard/artist" class="button">View Booking</a></p>
  </div>
  <div class="footer"><p>&copy; 2026 Leish. All rights reserved.</p></div>
</body>
</html>`;
  const text = `New Booking Received - ${params.bookingId}\n\nHi ${params.providerName},\n\nYou've received a new booking from ${params.customerName}.\n\nBOOKING DETAILS:\n- Reference: ${params.bookingId}\n- Service: ${params.serviceName}\n- Date: ${params.date}\n- Time: ${params.time}\n\nView Booking: ${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/dashboard/artist\n\n&copy; 2026 Leish. All rights reserved.`;
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
