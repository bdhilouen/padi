/**
 * Response shape for a single entry in GET /users/me/sessions.
 *
 * Only safe, UI-relevant session fields are included.
 * user_id is intentionally omitted (redundant — the caller is the user).
 * Internal join fields are never included.
 */
export class SessionDto {
  id: string;
  device_name: string | null;
  user_agent: string | null;
  ip_address: string | null;
  is_active: boolean;
  login_at: Date;
  last_activity_at: Date;
  logout_at: Date | null;
}
