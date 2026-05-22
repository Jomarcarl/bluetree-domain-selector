-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientNiche" TEXT NOT NULL,
    "budgetPerLink" DOUBLE PRECISION NOT NULL,
    "geoFocus" TEXT NOT NULL,
    "followPreference" TEXT NOT NULL,
    "minDr" INTEGER NOT NULL DEFAULT 50,
    "minTraffic" INTEGER NOT NULL DEFAULT 3000,
    "linkCountGoal" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetPage" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "primaryKeyword" TEXT NOT NULL,

    CONSTRAINT "TargetPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorDomain" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "dr" INTEGER NOT NULL,
    "traffic" INTEGER NOT NULL,
    "geo" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "tat" TEXT,
    "linkType" TEXT NOT NULL,
    "contactEmail" TEXT,
    "mainNiche" TEXT,
    "complementaryNiche" TEXT,
    "indirectNiche" TEXT,
    "ranking" TEXT,
    "redFlags" TEXT,
    "rawJson" JSONB,

    CONSTRAINT "VendorDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoringConfig" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "weightsJson" JSONB NOT NULL,
    "rulesJson" JSONB NOT NULL,
    "promptsJson" JSONB,
    "overridesJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoringConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoredDomain" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "vendorDomainId" TEXT NOT NULL,
    "scoringConfigId" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "breakdownJson" JSONB,
    "reasoningSummary" TEXT,
    "disqualified" BOOLEAN NOT NULL DEFAULT false,
    "disqualificationReason" TEXT,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoredDomain_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TargetPage" ADD CONSTRAINT "TargetPage_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorDomain" ADD CONSTRAINT "VendorDomain_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoredDomain" ADD CONSTRAINT "ScoredDomain_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoredDomain" ADD CONSTRAINT "ScoredDomain_vendorDomainId_fkey" FOREIGN KEY ("vendorDomainId") REFERENCES "VendorDomain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoredDomain" ADD CONSTRAINT "ScoredDomain_scoringConfigId_fkey" FOREIGN KEY ("scoringConfigId") REFERENCES "ScoringConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
