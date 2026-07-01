/**
 * Single source of truth for the notification opt-out rule.
 *
 * The reminder scheduler (scripts/scheduler.ts) and the contact/broadcast
 * endpoint (POST /api/v1/email) both consult this so a user who turns off
 * notifications — globally or for a single program — is consistently
 * suppressed across every outbound channel.
 *
 * The model is opt-out: no stored preference for a program means "enabled".
 */

interface ProgramNotificationPref {
  programId: string;
  enabled: boolean;
}

/**
 * Returns true when an email or reminder for `programId` may be sent to a user
 * whose global flag is `globalEnabled` and whose per-program preferences are
 * `prefs`. Absence of a per-program entry is treated as enabled.
 */
export function shouldSendNotifications(
  globalEnabled: boolean,
  prefs: ProgramNotificationPref[],
  programId: string,
): boolean {
  if (!globalEnabled) return false;
  const pref = prefs.find((p) => p.programId === programId);
  return pref?.enabled ?? true;
}
