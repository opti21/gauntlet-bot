-- CreateTable
CREATE TABLE "gauntlet_weeks" (
    "active" BOOLEAN DEFAULT false,
    "accepting_submissions" BOOLEAN DEFAULT true,
    "week" INTEGER NOT NULL,
    "theme" VARCHAR,
    "description" VARCHAR,
    "editing" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("week")
);

-- CreateTable
CREATE TABLE "submissions" (
    "editing" BOOLEAN,
    "description" VARCHAR,
    "submitted" BOOLEAN NOT NULL DEFAULT false,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "vod_link" VARCHAR,
    "discord_message" VARCHAR,
    "react_discord_message" VARCHAR,
    "id" BIGSERIAL NOT NULL,
    "gauntlet_week" INTEGER NOT NULL,
    "attachments" VARCHAR[],
    "user" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGINT NOT NULL,
    "user_pic" VARCHAR,
    "username" VARCHAR,
    "twitch_username" VARCHAR,
    "currently_editing" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "submissions" ADD FOREIGN KEY ("gauntlet_week") REFERENCES "gauntlet_weeks"("week") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD FOREIGN KEY ("user") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD FOREIGN KEY ("currently_editing") REFERENCES "submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
