# Loan and tax calculators

- Owner engines: `loan.js`, `loanPrepayment.js`, `loanEligibility.js`, `incomeTax.js`.
- Loan EMI uses the quoted annual rate divided by 12; output amortization, total interest, and inflation-adjusted payment views.
- Prepayment compares baseline amortization with extra monthly and one-time prepayment scenarios; report time/interest savings. Maintain zero-rate and paid-off safeguards.
- Eligibility estimates affordable EMI from monthly income and existing EMIs, then solves maximum principal for rate/tenure. It is an estimate, not lender approval.
- Income tax compares old/new Indian regimes. Code presently applies 4% cess, ₹1.5L 80C cap, ₹2L home-loan-interest cap, regime standard deductions/rebates, salary/other income/capital gains inputs.
- Tax thresholds and tax-gain harvesting values are time-sensitive. Verify current law before changing values or presenting legal claims, then update tests and calculator-facing copy together.
