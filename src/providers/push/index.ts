import webpush from "./webpush.js";

export async function sendPush(
  subscription: any,
  payload: object
) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify(payload)
    );

    return { success: true };
  } catch (err) {
    console.error("Push failed:", err);
    return { success: false };
  }
}