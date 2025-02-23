import { users, folders, links, tags, linkTags, sharedLinks, type User, type InsertUser, type Folder, type Link, type Tag, type SharedLink } from "@shared/schema";
import { db } from "./db";
import { eq, and, like, or } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import crypto from "crypto";
import metascraper from "metascraper";
import metascraperTitle from "metascraper-title";
import metascraperDesc from "metascraper-description";
import metascraperImage from "metascraper-image";
import metascraperUrl from "metascraper-url";
import got from "got";

const PostgresSessionStore = connectPg(session);

const scraper = metascraper([
  metascraperTitle(),
  metascraperDesc(),
  metascraperImage(),
  metascraperUrl()
]);

export interface IStorage {
  sessionStore: session.Store;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Folder operations
  createFolder(userId: number, name: string): Promise<Folder>;
  getFolders(userId: number): Promise<Folder[]>;

  // Link operations
  createLink(link: Omit<Link, "id" | "createdAt">): Promise<Link>;
  getLinks(userId: number, search?: string): Promise<Link[]>;
  getLinksByFolder(folderId: number): Promise<Link[]>;
  getLinksByTag(tagId: number): Promise<Link[]>;

  // Tag operations
  createTag(userId: number, name: string): Promise<Tag>;
  getTags(userId: number): Promise<Tag[]>;
  addTagToLink(linkId: number, tagId: number): Promise<void>;
  removeTagFromLink(linkId: number, tagId: number): Promise<void>;

  // Sharing
  createSharedLink(linkId: number): Promise<SharedLink>;
  getSharedLink(token: string): Promise<Link | undefined>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async createFolder(userId: number, name: string): Promise<Folder> {
    const [folder] = await db
      .insert(folders)
      .values({ userId, name })
      .returning();
    return folder;
  }

  async getFolders(userId: number): Promise<Folder[]> {
    return db.select().from(folders).where(eq(folders.userId, userId));
  }

  async createLink(link: Omit<Link, "id" | "createdAt">): Promise<Link> {
    try {
      // Fetch metadata
      const { body: html, url } = await got(link.url);
      const metadata = await scraper({ html, url });

      const [newLink] = await db
        .insert(links)
        .values({
          ...link,
          title: metadata.title || "Untitled",
          description: metadata.description || null,
          favicon: metadata.image || null,
          createdAt: new Date(),
        })
        .returning();
      return newLink;
    } catch (error) {
      // If metadata fetching fails, save with basic info
      const [newLink] = await db
        .insert(links)
        .values({
          ...link,
          title: "Untitled",
          createdAt: new Date(),
        })
        .returning();
      return newLink;
    }
  }

  async getLinks(userId: number, search?: string): Promise<Link[]> {
    let query = db.select().from(links).where(eq(links.userId, userId));

    if (search) {
      query = query.where(
        or(
          like(links.title, `%${search}%`),
          like(links.description || '', `%${search}%`),
          like(links.notes || '', `%${search}%`),
          like(links.url, `%${search}%`)
        )
      );
    }

    return query;
  }

  async getLinksByFolder(folderId: number): Promise<Link[]> {
    return db.select().from(links).where(eq(links.folderId, folderId));
  }

  async getLinksByTag(tagId: number): Promise<Link[]> {
    const linkIds = await db
      .select()
      .from(linkTags)
      .where(eq(linkTags.tagId, tagId));

    return Promise.all(
      linkIds.map(async ({ linkId }) => {
        const [link] = await db
          .select()
          .from(links)
          .where(eq(links.id, linkId));
        return link;
      })
    );
  }

  async createTag(userId: number, name: string): Promise<Tag> {
    const [tag] = await db
      .insert(tags)
      .values({ userId, name })
      .returning();
    return tag;
  }

  async getTags(userId: number): Promise<Tag[]> {
    return db.select().from(tags).where(eq(tags.userId, userId));
  }

  async addTagToLink(linkId: number, tagId: number): Promise<void> {
    await db.insert(linkTags).values({ linkId, tagId });
  }

  async removeTagFromLink(linkId: number, tagId: number): Promise<void> {
    await db
      .delete(linkTags)
      .where(and(eq(linkTags.linkId, linkId), eq(linkTags.tagId, tagId)));
  }

  async createSharedLink(linkId: number): Promise<SharedLink> {
    const [shared] = await db
      .insert(sharedLinks)
      .values({ linkId, token: crypto.randomBytes(16).toString('hex'), createdAt: new Date() })
      .returning();
    return shared;
  }

  async getSharedLink(token: string): Promise<Link | undefined> {
    const [shared] = await db
      .select()
      .from(sharedLinks)
      .where(eq(sharedLinks.token, token));

    if (!shared) return undefined;

    const [link] = await db
      .select()
      .from(links)
      .where(eq(links.id, shared.linkId));

    return link;
  }
}

export const storage = new DatabaseStorage();