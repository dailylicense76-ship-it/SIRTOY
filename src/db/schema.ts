import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const installations = pgTable('installations', {
  id: serial('id').primaryKey(),
  machineId: text('machine_id').notNull().unique(),
  clientName: text('client_name').notNull(),
  platform: text('platform'),
  status: text('status').default('Online'),
  location: text('location'),
  lastActive: timestamp('last_active').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});
