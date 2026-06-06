-- Prevent the same phone number from being attached to more than one customer
-- account. This is the hard backstop behind the app-level check in
-- app/api/auth/create-customer/route.ts (PHONE_TAKEN).
--
-- `customers.phone` is NOT NULL and uses '' as the "no phone" sentinel (OAuth
-- users, cleared numbers), so a plain UNIQUE(phone) is not possible. A partial
-- unique index allows any number of blank phones but guarantees that every
-- real number maps to exactly one account.
--
-- Existing duplicates were resolved before applying this index.
CREATE UNIQUE INDEX IF NOT EXISTS customers_phone_unique_not_blank
  ON public.customers (phone)
  WHERE phone <> '';
