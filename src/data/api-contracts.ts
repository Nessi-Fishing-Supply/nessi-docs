import type { ApiGroup } from '@/types/api-contract';

export const apiGroups: ApiGroup[] = [
  {
    name: 'Authentication',
    endpoints: [
      { method: 'POST', path: '/api/auth/register', description: 'Register new user (email + password, triggers OTP)', why: 'Uses admin client to create user, bypassing Supabase email confirm for custom OTP UX. Validates via validateRegisterInput().' },
      { method: 'POST', path: '/api/auth/check-email', description: 'Check email availability', why: 'Paginated user lookup (1000/page) with case-insensitive matching. Returns 409 DUPLICATE_EMAIL if taken.' },
      { method: 'GET', path: '/api/auth/callback', description: 'OAuth / email verification callback', why: 'Handles token_hash (email OTP) and code (PKCE OAuth) flows. Sanitizes redirect path to prevent open redirects.' },
      { method: 'DELETE', path: '/api/auth/delete-account', description: 'Full account deletion + cascading cleanup', why: 'Blocks if user owns active shops (409 OWNS_SHOPS). Soft-deletes listings, releases slug, deletes storage, then deletes auth user.' },
    ],
  },
  {
    name: 'Listings — CRUD',
    endpoints: [
      { method: 'GET', path: '/api/listings', description: 'Browse/search with filters + pagination', why: 'Filters: category, condition (comma-separated), price range, sort (newest/price_asc/price_desc/watched). Limit clamped 1-100, default 24.' },
      { method: 'POST', path: '/api/listings', description: 'Create draft listing (X-Nessi-Context)', why: 'Shop context via X-Nessi-Context: shop:{id} header. Field whitelist (ALLOWED_CREATE_FIELDS) prevents mass assignment.' },
      { method: 'GET', path: '/api/listings/[id]', description: 'Single listing with photos', why: 'Non-active listings (draft/archived/deleted) only visible to owner. Returns 404 for non-owners viewing non-active.' },
      { method: 'PUT', path: '/api/listings/[id]', description: 'Update listing (whitelisted fields)', why: 'Ownership check (seller_id = user.id). Only ALLOWED_FIELDS subset accepted. Returns 400 if no valid fields.' },
      { method: 'DELETE', path: '/api/listings/[id]', description: 'Soft-delete listing + storage cleanup', why: 'Sets deleted_at + status=deleted. Best-effort deletion of listing photos from listing-images bucket.' },
      { method: 'PATCH', path: '/api/listings/[id]/status', description: 'Status transition (state machine)', why: 'VALID_TRANSITIONS: draft→active/deleted, active→archived/sold, archived→active. Sets published_at on draft→active, sold_at on →sold.' },
      { method: 'POST', path: '/api/listings/[id]/duplicate', description: 'Clone listing as new draft', why: 'Copies fields (not photos), sets title="Copy of {original}". Respects X-Nessi-Context for shop attribution.' },
      { method: 'POST', path: '/api/listings/[id]/view', description: 'Record view (increment + recently_viewed)', why: 'No-op for unauthenticated users. Increments view_count and upserts recently_viewed in parallel.' },
    ],
  },
  {
    name: 'Listings — Search & Discovery',
    endpoints: [
      { method: 'GET', path: '/api/listings/search', description: 'Advanced FTS with trigram fallback', why: 'Primary: websearch on search_vector tsvector. Fallback: ILIKE on title/brand if FTS returns 0. Filters: category, condition, price, state, free_shipping.' },
      { method: 'GET', path: '/api/listings/autocomplete', description: 'Search autocomplete (3 sources)', why: 'Parallel fetch from search_suggestions (ilike, top 4), active listings (ilike title, top 3), and LISTING_CATEGORIES (local fuzzy). Max 8 results, deduplicated.' },
      { method: 'POST', path: '/api/listings/search-suggestions', description: 'Record search term popularity', why: 'Upserts search_suggestions: existing terms get popularity++, new terms start at 1. Term must be ≥2 chars.' },
      { method: 'GET', path: '/api/listings/recommendations', description: 'Get personalized listing recommendations', why: 'Returns recommended listings based on user activity and preferences.' },
      { method: 'GET', path: '/api/listings/seller', description: "Fetch seller's own listings", why: 'Filtered by seller_id. X-Nessi-Context determines personal (shop_id IS NULL) vs shop scope. Optional status filter.' },
    ],
  },
  {
    name: 'Listings — Drafts & Photos',
    endpoints: [
      { method: 'GET', path: '/api/listings/drafts', description: 'Fetch all draft listings', why: 'Filtered by seller_id, status=draft, deleted_at IS NULL. Returns with photos.' },
      { method: 'POST', path: '/api/listings/drafts', description: 'Create empty draft', why: 'Sets defaults: title=Untitled Draft, price=0, category=other, condition=good. Respects shop context.' },
      { method: 'DELETE', path: '/api/listings/drafts', description: 'Hard-delete draft listing', why: 'Query param id. Verifies seller ownership AND status=draft. Unlike normal delete, this is a hard delete.' },
      { method: 'POST', path: '/api/listings/upload', description: 'Upload photo (image → WebP)', why: 'Sharp processing: full=2000px/q80, thumb=400px/q70. MIME: JPEG/PNG/WebP/HEIC. Max 20MB. Updates cover_photo_url if first photo.' },
      { method: 'DELETE', path: '/api/listings/upload/delete', description: 'Delete listing photo from storage', why: 'Verifies ownership via storage path parsing ({user_id}/{listing_id}/{uuid}.webp). Deletes both full and thumbnail.' },
    ],
  },
  {
    name: 'Cart',
    endpoints: [
      { method: 'GET', path: '/api/cart', description: 'Fetch authenticated cart', why: 'Returns cart items via getCartServer(user.id) with joined listing data.' },
      { method: 'POST', path: '/api/cart', description: 'Add item to cart (25-item limit)', why: 'Validates: listing exists + active, not own listing (403), not already in cart (409), cart not full (422). Price snapshot at add time.' },
      { method: 'DELETE', path: '/api/cart', description: 'Clear entire cart', why: 'Bulk delete all cart_items for user.' },
      { method: 'GET', path: '/api/cart/count', description: 'Cart item count', why: 'Lightweight count for navbar badge without full cart data fetch.' },
      { method: 'DELETE', path: '/api/cart/[id]', description: 'Remove single item', why: 'Deletes by cart item ID. Returns 404 if not found.' },
      { method: 'PATCH', path: '/api/cart/[id]/expiry', description: 'Refresh 30-day expiry', why: 'Extends expires_at on the cart item. Column-level grant restricts UPDATE to expires_at only.' },
      { method: 'POST', path: '/api/cart/validate', description: 'Validate cart items', why: 'Pre-checkout check: detects price changes, sold/deleted listings, and availability issues.' },
      { method: 'POST', path: '/api/cart/merge', description: 'Merge guest localStorage cart to DB', why: 'Server validates each item: exists, not sold, not own, not duplicate. Invalid items silently dropped.' },
    ],
  },
  {
    name: 'Shops — CRUD',
    endpoints: [
      { method: 'POST', path: '/api/shops', description: 'Create shop (atomic slug + owner membership)', why: 'Checks 5-shop limit. Inserts shop, calls reserve_slug() RPC, inserts shop_members with OWNER role. Rolls back on slug failure.' },
      { method: 'GET', path: '/api/shops/[id]', description: 'Get shop details', why: 'Returns shop info for storefront and settings pages.' },
      { method: 'PUT', path: '/api/shops/[id]', description: 'Update shop settings', why: 'Requires shop_settings:full permission via requireShopPermission().' },
      { method: 'DELETE', path: '/api/shops/[id]', description: 'Soft-delete shop + full cleanup', why: 'Requires shop_settings:full. Cleans storage (avatar, banner, listing photos), soft-deletes listings, releases slug, sets deleted_at.' },
      { method: 'POST', path: '/api/shops/slug', description: 'Update/reserve shop slug', why: 'Requires shop_settings:full. Calls reserve_slug() RPC atomically. Returns 409 if taken.' },
      { method: 'POST', path: '/api/shops/avatar', description: 'Upload shop avatar', why: 'Sharp: 200x200 cover, WebP q80. Stored at profile-assets/shops/{id}/avatar.webp. Requires shop_settings:full.' },
      { method: 'POST', path: '/api/shops/hero-banner', description: 'Upload hero banner', why: 'Sharp: max 1200x400 inside, WebP q85. Updates shops.hero_banner_url. Requires shop_settings:full.' },
    ],
  },
  {
    name: 'Shops — Members & Invites',
    endpoints: [
      { method: 'POST', path: '/api/shops/[id]/members', description: 'Add member directly (admin)', why: 'Requires members:full permission. Inserts shop_members row with specified role.' },
      { method: 'DELETE', path: '/api/shops/[id]/members/[memberId]', description: 'Remove member from shop', why: 'Requires members:full OR self-removal (member can always leave). Deletes shop_members row.' },
      { method: 'PATCH', path: '/api/shops/[id]/members/[memberId]/role', description: 'Change member role', why: 'Requires members:full. Prevents changing owner role or assigning owner role. Validates role exists.' },
      { method: 'GET', path: '/api/shops/[id]/roles', description: 'List available roles', why: 'Requires members:view. Returns system roles + custom shop roles.' },
      { method: 'GET', path: '/api/shops/[id]/invites', description: 'List shop invites', why: 'Requires members:view. Returns all invites with invited_by member info.' },
      { method: 'POST', path: '/api/shops/[id]/invites', description: 'Send invite email (7-day token)', why: "Requires members:full. Checks member cap (members + pending ≤ MAX). Generates UUID token, sends via Resend. Email failure logged but doesn't block 201." },
      { method: 'DELETE', path: '/api/shops/[id]/invites/[inviteId]', description: 'Revoke pending invite', why: 'Requires members:full. Only works on status=pending. Sets status to revoked.' },
      { method: 'POST', path: '/api/shops/[id]/invites/[inviteId]/resend', description: 'Resend invite with new token', why: 'Requires members:full. Generates new token, resets 7-day expiry, resends email.' },
      { method: 'POST', path: '/api/invites/[token]/accept', description: 'Accept shop invite (join shop)', why: 'Cookie auth. Validates: pending + not expired + not revoked. Checks member cap, 5-shop limit, not already member. Inserts membership, marks accepted.' },
    ],
  },
  {
    name: 'Shops — Ownership Transfer',
    endpoints: [
      { method: 'GET', path: '/api/shops/[id]/ownership', description: 'Get pending transfer for shop', why: 'Requires members:view. Returns pending transfer if exists and not expired.' },
      { method: 'POST', path: '/api/shops/[id]/ownership-transfer', description: 'Initiate ownership transfer', why: 'Requires members:full. Prevents self-transfer. Verifies recipient is shop member. One pending per shop. Generates 7-day token.' },
      { method: 'DELETE', path: '/api/shops/[id]/ownership-transfer', description: 'Cancel pending transfer', why: 'Requires members:full. Sets transfer status to cancelled.' },
      { method: 'GET', path: '/api/shops/ownership-transfer/[token]', description: 'Get transfer details (for recipient)', why: 'Verifies user is intended recipient (to_member_id). Returns 410 if expired. Includes shop and member names.' },
      { method: 'POST', path: '/api/shops/ownership-transfer/[token]/accept', description: 'Execute ownership transfer', why: 'Calls accept_ownership_transfer RPC: atomically swaps owner→manager, recipient→owner, marks transfer accepted.' },
    ],
  },
  {
    name: 'Members',
    endpoints: [
      { method: 'POST', path: '/api/members/toggle-seller', description: 'Enable/disable seller mode', why: 'When disabling: archives all member-owned active listings (shop_id IS NULL). Updates is_seller flag.' },
      { method: 'POST', path: '/api/members/avatar', description: 'Upload profile avatar', why: 'Sharp: 200x200 cover, WebP q80. Stored at profile-assets/members/{id}/avatar.webp.' },
      { method: 'GET', path: '/api/members/seller-preconditions', description: 'Check if seller can be disabled', why: 'Counts active member-owned listings + active orders (TODO). canDisable = true only if both are 0.' },
    ],
  },
  {
    name: 'Addresses',
    endpoints: [
      { method: 'GET', path: '/api/addresses', description: 'List user addresses', why: 'Returns all addresses for authenticated user.' },
      { method: 'POST', path: '/api/addresses', description: 'Create address (max 5 per user)', why: 'Yup validation. Max enforced by enforce_max_addresses() trigger. 422 if limit exceeded.' },
      { method: 'PUT', path: '/api/addresses/[id]', description: 'Update address', why: 'Yup validation with stripUnknown. Sets line2 to undefined if falsy.' },
      { method: 'DELETE', path: '/api/addresses/[id]', description: 'Delete address', why: 'Hard delete. Returns 404 if not found.' },
      { method: 'PATCH', path: '/api/addresses/[id]/default', description: 'Set as default address', why: 'Sets is_default=true. ensure_single_default() trigger unsets previous default.' },
    ],
  },
  {
    name: 'Recently Viewed',
    endpoints: [
      { method: 'GET', path: '/api/recently-viewed', description: 'Fetch view history', why: 'Returns user view history via getRecentlyViewedServer(). Capped at 50 per user by trigger.' },
      { method: 'DELETE', path: '/api/recently-viewed', description: 'Clear view history', why: 'Deletes all recently_viewed rows for user.' },
      { method: 'POST', path: '/api/recently-viewed/merge', description: 'Merge guest history to DB', why: 'Merges localStorage recently-viewed items into authenticated user history.' },
    ],
  },
];
