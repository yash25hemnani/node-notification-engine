import webpush from "web-push";
import { ENV } from "../../config/env";

webpush.setVapidDetails(
  "mailto:yashhemnani8504@gmail.com",
  ENV.VAPID.PUBLIC,
  ENV.VAPID.PRIVATE
);

export default webpush;