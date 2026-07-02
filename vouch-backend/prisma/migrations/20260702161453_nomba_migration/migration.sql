-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('PENDING', 'PARTIAL', 'FUNDED', 'OVERFUNDED', 'IN_PROGRESS', 'COMPLETED', 'DISBURSED', 'REFUNDED', 'FROZEN');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'BUYER_CONFIRMED', 'SELLER_CONFIRMED', 'COMPLETED', 'DISBURSED');

-- CreateEnum
CREATE TYPE "FraudFlag" AS ENUM ('GREEN', 'AMBER', 'RED');

-- CreateEnum
CREATE TYPE "LogEvent" AS ENUM ('IDENTITY_VERIFIED', 'IDENTITY_FAILED', 'FRAUD_ASSESSED', 'FRAUD_BLOCKED', 'ESCROW_CREATED', 'ESCROW_FUNDED', 'ESCROW_FUND_FAILED', 'ESCROW_FROZEN', 'MILESTONE_CONFIRMED', 'DISBURSEMENT_COMPLETED', 'DISBURSEMENT_FAILED', 'OVERPAYMENT_FLAGGED', 'RECONCILIATION_MATCHED');

-- CreateTable
CREATE TABLE "Developer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "supabaseUid" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Developer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformUser" (
    "id" TEXT NOT NULL,
    "externalUserId" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "identityVerified" BOOLEAN NOT NULL DEFAULT false,
    "identityMatchScore" DOUBLE PRECISION,
    "livenessPassed" BOOLEAN NOT NULL DEFAULT false,
    "documentType" TEXT,
    "onboardingLocation" JSONB,
    "deviceFingerprintAtOnboarding" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default Key',
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "buyerExternalId" TEXT NOT NULL,
    "sellerExternalId" TEXT NOT NULL,
    "status" "EscrowStatus" NOT NULL DEFAULT 'PENDING',
    "nombaVirtualAccountId" TEXT,
    "nombaVirtualAccountNo" TEXT,
    "nombaVirtualAccountRef" TEXT,
    "amountReceived" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "buyerConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "sellerConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "nombaTransactionId" TEXT,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "disbursedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudAssessment" (
    "id" TEXT NOT NULL,
    "platformUserId" TEXT NOT NULL,
    "agreementId" TEXT,
    "score" INTEGER NOT NULL,
    "flag" "FraudFlag" NOT NULL,
    "category" TEXT NOT NULL,
    "triggeredSignals" JSONB NOT NULL,
    "contextSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NombaTransfer" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "nombaReference" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "senderName" TEXT,
    "senderBank" TEXT,
    "senderAccount" TEXT,
    "rawWebhookPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NombaTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeveloperLog" (
    "id" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "eventType" "LogEvent" NOT NULL,
    "externalUserId" TEXT,
    "agreementId" TEXT,
    "score" INTEGER,
    "flag" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeveloperLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Developer_email_key" ON "Developer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Developer_supabaseUid_key" ON "Developer"("supabaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformUser_externalUserId_developerId_key" ON "PlatformUser"("externalUserId", "developerId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "NombaTransfer_nombaReference_key" ON "NombaTransfer"("nombaReference");

-- AddForeignKey
ALTER TABLE "PlatformUser" ADD CONSTRAINT "PlatformUser_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudAssessment" ADD CONSTRAINT "FraudAssessment_platformUserId_fkey" FOREIGN KEY ("platformUserId") REFERENCES "PlatformUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudAssessment" ADD CONSTRAINT "FraudAssessment_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NombaTransfer" ADD CONSTRAINT "NombaTransfer_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeveloperLog" ADD CONSTRAINT "DeveloperLog_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
