import { createThirdwebClient } from "thirdweb";

const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

if (!clientId) {
  throw new Error(
    "A variavel NEXT_PUBLIC_THIRDWEB_CLIENT_ID nao foi configurada.",
  );
}

export const thirdwebClient = createThirdwebClient({ clientId });
