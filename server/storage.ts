import { User, InsertUser, Folder, Link, Tag, SharedLink } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import crypto from "crypto";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Folder operations
  createFolder(userId: number, name: string): Promise<Folder>;
  getFolders(userId: number): Promise<Folder[]>;
  
  // Link operations
  createLink(link: Omit<Link, "id" | "createdAt">): Promise<Link>;
  getLinks(userId: number): Promise<Link[]>;
  getLinksByFolder(folderId: number): Promise<Link[]>;
  
  // Tag operations
  createTag(userId: number, name: string): Promise<Tag>;
  getTags(userId: number): Promise<Tag[]>;
  addTagToLink(linkId: number, tagId: number): Promise<void>;
  
  // Sharing
  createSharedLink(linkId: number): Promise<SharedLink>;
  getSharedLink(token: string): Promise<Link | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private folders: Map<number, Folder>;
  private links: Map<number, Link>;
  private tags: Map<number, Tag>;
  private linkTags: Map<string, boolean>;
  private sharedLinks: Map<string, SharedLink>;
  sessionStore: session.Store;
  private currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.folders = new Map();
    this.links = new Map();
    this.tags = new Map();
    this.linkTags = new Map();
    this.sharedLinks = new Map();
    this.currentId = { users: 1, folders: 1, links: 1, tags: 1 };
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const newUser = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async createFolder(userId: number, name: string): Promise<Folder> {
    const id = this.currentId.folders++;
    const folder = { id, userId, name };
    this.folders.set(id, folder);
    return folder;
  }

  async getFolders(userId: number): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter(f => f.userId === userId);
  }

  async createLink(link: Omit<Link, "id" | "createdAt">): Promise<Link> {
    const id = this.currentId.links++;
    const newLink = { ...link, id, createdAt: new Date() };
    this.links.set(id, newLink);
    return newLink;
  }

  async getLinks(userId: number): Promise<Link[]> {
    return Array.from(this.links.values()).filter(l => l.userId === userId);
  }

  async getLinksByFolder(folderId: number): Promise<Link[]> {
    return Array.from(this.links.values()).filter(l => l.folderId === folderId);
  }

  async createTag(userId: number, name: string): Promise<Tag> {
    const id = this.currentId.tags++;
    const tag = { id, userId, name };
    this.tags.set(id, tag);
    return tag;
  }

  async getTags(userId: number): Promise<Tag[]> {
    return Array.from(this.tags.values()).filter(t => t.userId === userId);
  }

  async addTagToLink(linkId: number, tagId: number): Promise<void> {
    const key = `${linkId}-${tagId}`;
    this.linkTags.set(key, true);
  }

  async createSharedLink(linkId: number): Promise<SharedLink> {
    const id = this.currentId.links++;
    const token = crypto.randomBytes(16).toString('hex');
    const sharedLink = { id, linkId, token, createdAt: new Date() };
    this.sharedLinks.set(token, sharedLink);
    return sharedLink;
  }

  async getSharedLink(token: string): Promise<Link | undefined> {
    const shared = this.sharedLinks.get(token);
    if (!shared) return undefined;
    return this.links.get(shared.linkId);
  }
}

export const storage = new MemStorage();
