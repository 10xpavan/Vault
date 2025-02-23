import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import axios from "axios";
import { z } from "zod";
import { insertFolderSchema, insertLinkSchema } from "@shared/schema";
import { JSDOM } from "jsdom";

async function fetchMetadata(url: string) {
  try {
    const response = await axios.get(url);
    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    const title = document.querySelector('title')?.textContent || 
                 document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                 url;

    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') ||
                       document.querySelector('meta[property="og:description"]')?.getAttribute('content');

    const favicon = document.querySelector('link[rel="icon"]')?.getAttribute('href') ||
                   document.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') ||
                   `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`;

    return { title, description, favicon };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return { title: url, description: null, favicon: null };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/folders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const folders = await storage.getFolders(req.user.id);
    res.json(folders);
  });

  app.post("/api/folders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { name, parentId } = req.body;
    
    console.log('Creating folder with:', {
      userId: req.user.id,
      name,
      parentId: parentId || 'null'
    });
    
    const folder = await storage.createFolder(req.user.id, name, parentId || null);
    
    const allFolders = await storage.getFolders(req.user.id);
    console.log('All folders after creation:', allFolders);
    
    res.json(folder);
  });

  app.get("/api/links", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const folderId = req.query.folderId ? Number(req.query.folderId) : undefined;
    const search = req.query.search?.toString();

    let links = [];
    if (folderId !== undefined) {
      links = await storage.getLinksByFolder(folderId);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      links = links.filter(link => 
        link.title.toLowerCase().includes(searchLower) ||
        link.url.toLowerCase().includes(searchLower) ||
        link.description?.toLowerCase().includes(searchLower) ||
        link.notes?.toLowerCase().includes(searchLower)
      );
    }

    res.json(links);
  });

  app.post("/api/links", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const metadata = await fetchMetadata(req.body.url);

    const parsed = insertLinkSchema.parse({
      ...req.body,
      userId: req.user.id,
      title: metadata.title,
      description: metadata.description || null,
      favicon: metadata.favicon || null
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