import webpush from "web-push";
import { ENV } from "../../config/env.js";

webpush.setVapidDetails(
  "mailto:admin@yourapp.com",
  ENV.VAPID.PUBLIC,
  ENV.VAPID.PRIVATE
);

export default webpush;