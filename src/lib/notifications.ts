// Push notification helpers — full implementation in task 2.5.x

export async function sendListingReadyNotification(
  userId: string,
  listingId: string,
  title: string,
): Promise<void> {
  // TODO(2.5.6): Implement web push notification
  // For now, log the notification intent
  console.log(
    `[notification] Listing ready: userId=${userId} listingId=${listingId} title="${title}"`,
  );
}
