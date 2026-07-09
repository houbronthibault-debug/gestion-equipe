import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    pseudo: string;
    estAdmin: boolean;
    estMembreBureau: boolean;
  }

  interface Session {
    user: {
      id: string;
      pseudo: string;
      estAdmin: boolean;
      estMembreBureau: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    pseudo: string;
    estAdmin: boolean;
    estMembreBureau: boolean;
  }
}
