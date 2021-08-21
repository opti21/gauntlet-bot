/*
  Warnings:

  - Added the required column `etag` to the `files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `files` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "files" ADD COLUMN     "etag" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;
