import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../drizzle/schema";
import { sdk } from "./sdk";
import { verifyToken } from "../auth";
import { getUserByEmail } from "../db";
import { COOKIE_NAME } from "@shared/const";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Tentar autenticação local com JWT primeiro
  console.log("[AUTH DEBUG] Cookies recebidos:", opts.req.cookies);
  const token = opts.req.cookies?.[COOKIE_NAME];
  console.log("[AUTH DEBUG] Token JWT:", token ? "Presente" : "Ausente");
  if (token) {
    try {
      const payload = verifyToken(token);
      if (payload) {
        user = await getUserByEmail(payload.email);
      }
    } catch (error) {
      // Token inválido ou expirado
      user = null;
    }
  }

  // Se não conseguiu autenticar localmente, tentar OAuth (fallback)
  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
