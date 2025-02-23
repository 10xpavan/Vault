import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const links = pgTable("links", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  folderId: integer("folder_id")
    .notNull()
    .references(() => folders.id),
  url: text("url").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  favicon: text("favicon"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const linkTags = pgTable("link_tags", {
  linkId: integer("link_id")
    .notNull()
    .references(() => links.id),
  tagId: integer("tag_id")
    .notNull()
    .references(() => tags.id),
});

export const sharedLinks = pgTable("shared_links", {
  id: serial("id").primaryKey(),
  linkId: integer("link_id")
    .notNull()
    .references(() => links.id),
  sharedWithEmail: text("shared_with_email").notNull(),
  token: text("token").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  folders: many(folders),
  links: many(links),
  tags: many(tags),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, {
    fields: [folders.userId],
    references: [users.id],
  }),
  links: many(links),
}));

export const linksRelations = relations(links, ({ one, many }) => ({
  user: one(users, {
    fields: [links.userId],
    references: [users.id],
  }),
  folder: one(folders, {
    fields: [links.folderId],
    references: [folders.id],
  }),
  tags: many(linkTags),
  sharedLinks: many(sharedLinks),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  links: many(linkTags),
}));

export const linkTagsRelations = relations(linkTags, ({ one }) => ({
  link: one(links, {
    fields: [linkTags.linkId],
    references: [links.id],
  }),
  tag: one(tags, {
    fields: [linkTags.tagId],
    references: [tags.id],
  }),
}));

export const sharedLinksRelations = relations(sharedLinks, ({ one }) => ({
  link: one(links, {
    fields: [sharedLinks.linkId],
    references: [links.id],
  }),
}));

// Schemas and Types
export const insertUserSchema = createInsertSchema(users).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address"),
});

export const insertFolderSchema = createInsertSchema(folders);
export const insertLinkSchema = createInsertSchema(links);
export const insertTagSchema = createInsertSchema(tags);

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Folder = typeof folders.$inferSelect;
export type Link = typeof links.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type SharedLink = typeof sharedLinks.$inferSelect;