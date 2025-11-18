// Carregar .env da raiz do projeto (não apenas do diretório server/)
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Tenta carregar .env da raiz do projeto (subindo 2 níveis de server/_core/)
config({ path: resolve(__dirname, "..", "..", ".env") });
// Tenta carregar .env do diretório server/
config({ path: resolve(__dirname, "..", ".env") });
// Tenta carregar .env do diretório atual
config();

import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // CORS configuration - allow requests from frontend
  // Aceita localhost em qualquer porta (5173, 5174, etc.)
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const allowedOrigins = frontendUrl.split(",").map(url => url.trim());
  
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Permitir localhost em qualquer porta para desenvolvimento
    const isLocalhost = origin && (
      origin.startsWith("http://localhost:") || 
      origin.startsWith("http://127.0.0.1:")
    );
    
    if (origin) {
      if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
      } else if (isLocalhost) {
        // Permitir qualquer porta do localhost em desenvolvimento
        res.header("Access-Control-Allow-Origin", origin);
      } else if (allowedOrigins.length === 1) {
        res.header("Access-Control-Allow-Origin", allowedOrigins[0]);
      }
    }
    
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.header("Access-Control-Expose-Headers", "Set-Cookie");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Configure cookie parser for JWT authentication
  app.use(cookieParser());
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Testar conexão com banco de dados na inicialização
  try {
    const { getDb } = await import("../db");
    const db = await getDb();
    if (db) {
      console.log("[Server] ✅ Banco de dados conectado e pronto!");
    } else {
      console.warn("[Server] ⚠️  Banco de dados não disponível - algumas funcionalidades podem não funcionar");
    }
  } catch (error: any) {
    console.error("[Server] ❌ Erro ao verificar conexão com banco:", error.message);
  }

  // Adicionar middleware de log para debug
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/trpc")) {
      console.log(`[API] ${req.method} ${req.path} - Origin: ${req.headers.origin || "none"}`);
    }
    next();
  });

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/ (accessible via http://18.216.112.160:${port})`);
    console.log(`[Server] CORS configurado para aceitar: ${frontendUrl}`);
    console.log(`[Server] Aceitando também qualquer localhost:* para desenvolvimento`);
  });
}

// Esta chamada deve estar FORA da função startServer
startServer().catch(console.error);