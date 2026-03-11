import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      profile: string;
      primaryOfficeId?: string | null;
      mustResetPassword?: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    profile: string;
    primaryOfficeId?: string | null;
    mustResetPassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    profile: string;
    primaryOfficeId?: string | null;
    mustResetPassword?: boolean;
  }
}
