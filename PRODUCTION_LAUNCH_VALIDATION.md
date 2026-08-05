# Production Launch Validation

## Summary

Validated core launch flows for the MVP in production.

## What was verified

- Rotated the production `BREVO_API_KEY` in Vercel and confirmed the new key is valid.
- Confirmed Brevo transactional email send works via direct API call.
- Confirmed the production `/api/contact` endpoint returns `200` and stores contact records.
- Confirmed the production `/api/bookings` endpoint creates bookings successfully.
- Confirmed Billplz deposit bill creation works for a real booking.
- Simulated a Billplz webhook payment success and verified the payment changed to `paid` and booking changed to `confirmed`.

## Notes

- `vercel env pull` writes masked values to `.env.production` for production secrets, so it should not be used to validate actual secret contents.
- The fix was in production environment rotation, not in app code.

## Result

The backend MVP booking, email, and Billplz payment flows are now validated and ready for launch.
