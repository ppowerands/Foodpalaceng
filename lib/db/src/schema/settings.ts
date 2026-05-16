import { pgTable, serial, boolean, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const restaurantSettingsTable = pgTable("restaurant_settings", {
  id: serial("id").primaryKey(),
  isOpen: boolean("is_open").notNull().default(true),
  openingTime: text("opening_time").notNull().default("09:00"),
  closingTime: text("closing_time").notNull().default("22:00"),
  estimatedDeliveryMin: integer("estimated_delivery_min").notNull().default(35),
  estimatedDeliveryMax: integer("estimated_delivery_max").notNull().default(45),
  bankName: text("bank_name").default("MONIEPOINT MFB"),
  accountName: text("account_name").default("USMAN SAMBO MARAFA"),
  accountNumber: text("account_number").default("9110064364"),
  whatsappNumber: text("whatsapp_number").default("+2349110064364"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRestaurantSettingsSchema = createInsertSchema(restaurantSettingsTable).omit({ id: true, updatedAt: true });
export type InsertRestaurantSettings = z.infer<typeof insertRestaurantSettingsSchema>;
export type RestaurantSettings = typeof restaurantSettingsTable.$inferSelect;
