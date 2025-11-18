import { createTRPCReact } from "@trpc/react-query";

// AppRouter type - this should match the server's AppRouter type
// For separated frontend/backend, we use a generic type
// The actual types will be inferred at runtime through tRPC
export type AppRouter = any;

export const trpc = createTRPCReact<AppRouter>();
