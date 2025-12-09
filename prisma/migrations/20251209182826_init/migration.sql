-- CreateEnum
CREATE TYPE "OrgUserRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "OrgUserRole" NOT NULL DEFAULT 'MEMBER',
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "OrgUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackedUser" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackedUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "trackedUserId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "properties" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgUser_organizationId_email_key" ON "OrgUser"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Project_apiKey_key" ON "Project"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "TrackedUser_projectId_externalId_key" ON "TrackedUser"("projectId", "externalId");

-- CreateIndex
CREATE INDEX "Event_projectId_occurredAt_idx" ON "Event"("projectId", "occurredAt");

-- CreateIndex
CREATE INDEX "Event_projectId_eventName_idx" ON "Event"("projectId", "eventName");

-- CreateIndex
CREATE INDEX "Event_trackedUserId_idx" ON "Event"("trackedUserId");

-- AddForeignKey
ALTER TABLE "OrgUser" ADD CONSTRAINT "OrgUser_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackedUser" ADD CONSTRAINT "TrackedUser_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_trackedUserId_fkey" FOREIGN KEY ("trackedUserId") REFERENCES "TrackedUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
