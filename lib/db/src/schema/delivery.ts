import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const deliveryZonesTable = pgTable("delivery_zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fee: numeric("fee", { precision: 12, scale: 2 }).notNull(),
  areas: text("areas").array().notNull().default([]),
  estimatedMinutes: integer("estimated_minutes").notNull().default(45),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDeliveryZoneSchema = createInsertSchema(deliveryZonesTable).omit({ id: true, createdAt: true });
export type InsertDeliveryZone = z.infer<typeof insertDeliveryZoneSchema>;
export type DeliveryZone = typeof deliveryZonesTable.$inferSelect;
