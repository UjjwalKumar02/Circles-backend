/*
  Warnings:

  - You are about to drop the column `isAnouncement` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Post" DROP COLUMN "isAnouncement",
ADD COLUMN     "isAnnouncement" BOOLEAN NOT NULL DEFAULT false;
