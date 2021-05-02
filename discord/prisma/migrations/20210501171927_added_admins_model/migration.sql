-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "twitch_username" TEXT NOT NULL,
    "discord_id" TEXT,

    PRIMARY KEY ("id")
);
