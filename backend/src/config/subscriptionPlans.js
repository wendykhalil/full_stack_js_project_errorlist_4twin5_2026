/**
 * Feature limits per subscription plan.
 * null = unlimited
 */
const PLANS = {
  FREE: {
    label: 'Gratuit',
    maxProjects: 1,
    maxPortfolio: 1,
    maxQuotesPerMonth: 1,
    maxInvoicesPerMonth: 1,
    canMessage: false,
    canOrder: false,
    canAccessServiceRequests: false,
    aiRequests: 0,
    weatherAccess: false,
  },
  BASIC: {
    label: 'Basic',
    maxProjects: 10,
    maxPortfolio: 5,
    maxQuotesPerMonth: 20,
    maxInvoicesPerMonth: 20,
    canMessage: true,
    canOrder: true,
    canAccessServiceRequests: true,
    aiRequests: 20,
    weatherAccess: true,
  },
  PRO: {
    label: 'Pro',
    maxProjects: null,
    maxPortfolio: null,
    maxQuotesPerMonth: null,
    maxInvoicesPerMonth: null,
    canMessage: true,
    canOrder: true,
    canAccessServiceRequests: true,
    aiRequests: null,
    weatherAccess: true,
  },
};

function getPlanFeatures(plan) {
  return PLANS[plan] || PLANS.FREE;
}

module.exports = { PLANS, getPlanFeatures };
