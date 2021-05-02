-- CreateTable
CREATE TABLE "twitch_creds" (
    "id" SERIAL NOT NULL,
    "access_token" TEXT NOT NULL,
    "expires_in" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);
