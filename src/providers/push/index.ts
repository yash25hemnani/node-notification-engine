export async function sendPush(to: string, payload: any) {
  console.log(" PUSH SENT:");
  console.log({ to, payload });

  return {
    success: true,
  };
}
