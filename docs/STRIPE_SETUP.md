# Stripe setup (coin bundles)

This project uses Stripe Checkout for one-time payments to buy coins. Configure the following for the Edge Functions `stripe-create-checkout` and `stripe-webhook`.

## Local dev: fix “Stripe is not configured”

When calling `http://127.0.0.1:54321/functions/v1/stripe-create-checkout`, the function reads env from **`supabase/functions/.env`** (not the Dashboard and not the project root). Do this:

1. **Create the file** (from repo root):
   ```bash
   cp supabase/functions/.env.example supabase/functions/.env
   ```
2. **Edit `supabase/functions/.env`** and set at least:
   - `stripe_secret_key=sk_test_...` (from [Stripe API keys](https://dashboard.stripe.com/test/apikeys))
   - `site_url=http://localhost:3000`
3. **Restart Supabase** so it loads the new env:
   ```bash
   supabase stop && supabase start
   ```

## Required environment variables (Supabase Edge Functions)

Set these in the Supabase Dashboard under **Project settings → Edge Functions → Secrets**, or in `supabase/functions/.env` for local dev. Use **lowercase** names only (letters, digits, underscores).

| Variable | Description |
|----------|-------------|
| `stripe_secret_key` | Stripe **test** secret key (`sk_test_...`). Never use the live key in development. |
| `stripe_webhook_secret` | Webhook signing secret (`whsec_...`) from the Stripe Dashboard or Stripe CLI. |
| `site_url` | Base URL of your app (e.g. `http://localhost:3000` for local, `https://yourdomain.com` in production). Used for Checkout `success_url` and `cancel_url`. The frontend can override this by sending `successBaseUrl` in the request body. |
| `stripe_price_pkg_1` | Stripe Price ID for the Starter bundle (10 coins). |
| `stripe_price_pkg_2` | Stripe Price ID for the Standard bundle (50 coins). |
| `stripe_price_pkg_3` | Stripe Price ID for the Business bundle (150 coins). |

## Local development

When you run `supabase start`, Edge Functions load env from **`supabase/functions/.env`**. Create that file (see step 2) and do not commit it.

1. **Create products and prices in Stripe (test mode)**  
   In [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products), create three one-time payment products (e.g. "Starter – 10 coins", "Standard – 50 coins", "Business – 150 coins") and note each product’s default **Price ID** (`price_...`).

2. **Create a local env file** so Edge Functions get your keys when you run `supabase start`:
   ```bash
   cp supabase/functions/.env.example supabase/functions/.env
   ```
   Edit `supabase/functions/.env` and set **`stripe_secret_key`** (and the other vars). Get your test key from [Stripe Dashboard → API keys](https://dashboard.stripe.com/test/apikeys). Restart Supabase after editing: `supabase stop && supabase start`.

3. **Forward webhooks to your local Edge Function** (so `checkout.session.completed` is received):
   ```bash
   stripe listen --forward-to http://127.0.0.1:54321/functions/v1/stripe-webhook
   ```
   **Important:** Copy the **exact** `whsec_...` value printed by `stripe listen` into `supabase/functions/.env` as `stripe_webhook_secret=whsec_...`. This secret is generated per session; if you restart `stripe listen`, copy the new value and run `supabase stop && supabase start` again.

4. **If the webhook returns 400:** Signature verification failed. Ensure `stripe_webhook_secret` in `supabase/functions/.env` matches the value from your **current** `stripe listen` output, then restart Supabase.

## Production

- Use your **live** Stripe keys and create live Products/Prices if you go live.
- In Stripe Dashboard → Developers → Webhooks, add an endpoint pointing to your deployed `stripe-webhook` URL and subscribe to `checkout.session.completed`. Use that endpoint’s signing secret for `stripe_webhook_secret`.
- Set `site_url` to your production app URL.
