/*
  Warnings:

  - You are about to drop the column `isAnnouncement` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the `CommentLike` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."CommentLike" DROP CONSTRAINT "CommentLike_commentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CommentLike" DROP CONSTRAINT "CommentLike_likedById_fkey";

-- AlterTable
ALTER TABLE "public"."Post" DROP COLUMN "isAnnouncement",
ADD COLUMN     "isAnouncement" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "public"."CommentLike";
