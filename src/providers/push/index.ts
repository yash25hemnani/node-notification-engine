import webpush from "./webpush";

export async function sendPush(
  subscription: any,
  payload: object
): Promise<void> {
  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    },
    JSON.stringify(payload)
  );
}