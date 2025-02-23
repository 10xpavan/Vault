import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import axios from "axios";
import { z } from "zod";
import { insertFolderSchema, insertLinkSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/folders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const folders = await storage.getFolders(req.user.id);
    res.json(folders);
  });

  app.post("/api/folders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertFolderSchema.parse({ ...req.body, userId: req.user.id });
    const folder = await storage.createFolder(req.user.id, parsed.name);
    res.json(folder);
  });

  app.get("/api/links", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const folderId = req.query.folderId ? Number(req.query.folderId) : undefined;
    const links = folderId 
      ? await storage.getLinksByFolder(folderId)
      : await storage.getLinks(req.user.id);
    res.json(links);
  });

  app.post("/api/links", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Fetch metadata
    const metadata = await axios.get(req.body.url);
    const title = metadata.data.match(/<title>(.*?)<\/title>/)?.[1] || req.body.url;
    const description = metadata.data.match(/<meta name="description" content="(.*?)">/)?.[1];
    const favicon = `https://www.google.com/s2/favicons?domain=${new URL(req.body.url).hostname}`;

    const parsed = insertLinkSchema.parse({
      ...req.body,
      userId: req.user.id,
      title,
      description,
      favicon
    });

    const link = await storage.createLink(parsed);
    res.json(link);
  });

  app.get("/api/tags", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const tags = await storage.getTags(req.user.id);
    res.json(tags);
  });

  app.post("/api/tags", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const tag = await storage.createTag(req.user.id, req.body.name);
    res.json(tag);
  });

  app.post("/api/links/:linkId/share", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const shared = await storage.createSharedLink(Number(req.params.linkId));
    res.json(shared);
  });

  app.get("/api/shared/:token", async (req, res) => {
    const link = await storage.getSharedLink(req.params.token);
    if (!link) return res.sendStatus(404);
    res.json(link);
  });

  const httpServer = createServer(app);
  return httpServer;
}
