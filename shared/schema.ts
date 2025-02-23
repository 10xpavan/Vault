import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
});

export const links = pgTable("links", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  folderId: integer("folder_id").notNull(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  favicon: text("favicon"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
});

export const linkTags = pgTable("link_tags", {
  linkId: integer("link_id").notNull(),
  tagId: integer("tag_id").notNull(),
});

export const sharedLinks = pgTable("shared_links", {
  id: serial("id").primaryKey(),
  linkId: integer("link_id").notNull(),
  token: text("token").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertFolderSchema = createInsertSchema(folders);
export const insertLinkSchema = createInsertSchema(links);
export const insertTagSchema = createInsertSchema(tags);

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Folder = typeof folders.$inferSelect;
export type Link = typeof links.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type SharedLink = typeof sharedLinks.$inferSelect;
