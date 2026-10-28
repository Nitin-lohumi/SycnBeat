/*
  Warnings:

  - You are about to drop the column `role` on the `RoomInvite` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `RoomMember` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[roomId,trackId]` on the table `RoomTrack` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "InviteStatus" ADD VALUE 'EXPIRED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'ROOM_INVITE';
ALTER TYPE "NotificationType" ADD VALUE 'YOU_LEFT_ROOM';
ALTER TYPE "NotificationType" ADD VALUE 'YOU_WERE_REMOVED_FROM_ROOM';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "roomId" TEXT;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "isLive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "liveAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RoomInvite" DROP COLUMN "role";

-- AlterTable
ALTER TABLE "RoomMember" DROP COLUMN "role",
ADD COLUMN     "canControl" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canQueue" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "RoomRole";

-- CreateIndex
CREATE INDEX "Notification_roomId_idx" ON "Notification"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomTrack_roomId_trackId_key" ON "RoomTrack"("roomId", "trackId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
