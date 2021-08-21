-- AlterTable
ALTER TABLE "files" ADD COLUMN     "submissionsId" INTEGER;

-- AddForeignKey
ALTER TABLE "files" ADD FOREIGN KEY ("submissionsId") REFERENCES "submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
