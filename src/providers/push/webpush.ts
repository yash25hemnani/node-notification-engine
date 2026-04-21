import webpush from "web-push";
import { ENV } from "../../config/env";

webpush.setVapidDetails(
  "mailto:admin@yourapp.com",
  ENV.VAPID.PUBLIC,
  ENV.VAPID.PRIVATE
);

export default webpush;