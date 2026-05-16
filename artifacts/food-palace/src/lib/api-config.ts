import { setAuthTokenGetter } from "@workspace/api-client-react";

export function setupApi() {
  setAuthTokenGetter(() => localStorage.getItem("food_palace_token"));
}
