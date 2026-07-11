export function periodicRate(annualRate, periodsPerYear = 12) {
  return Math.pow(1 + annualRate, 1 / periodsPerYear) - 1;
}

export function emi(principal, annualRate, months) {
  if (months <= 0) return 0;
  const r = periodicRate(annualRate, 12);
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

export function fvLumpsum(principal, annualRate, years) {
  return principal * Math.pow(1 + annualRate, years);
}

export function annualReturnAfterExpense(annualRate, expenseRatio = 0) {
  return (1 + annualRate) * (1 - Math.max(0, expenseRatio)) - 1;
}

export function fvSip(monthlyAmount, annualRate, months) {
  const r = periodicRate(annualRate, 12);
  if (months <= 0) return 0;
  if (r === 0) return monthlyAmount * months;
  return monthlyAmount * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
}

export function sipRequired(futureValue, annualRate, months) {
  const r = periodicRate(annualRate, 12);
  if (months <= 0) return 0;
  if (r === 0) return futureValue / months;
  const factor = ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
  return futureValue / factor;
}

export function pvGrowingAnnuity(payment, annualReturn, annualInflation, years) {
  if (years <= 0) return 0;
  if (Math.abs(annualReturn - annualInflation) < 1e-9) {
    return payment * years;
  }
  const ratio = (1 + annualInflation) / (1 + annualReturn);
  return payment * (1 - Math.pow(ratio, years)) / (annualReturn - annualInflation);
}

export function cagr(initial, finalValue, years) {
  if (initial <= 0 || years <= 0) return 0;
  return Math.pow(finalValue / initial, 1 / years) - 1;
}

export function compoundFrequencyRate(annualRate, frequency) {
  return annualRate / frequency;
}

export function fdMaturity(principal, annualRate, years, frequency = 4) {
  return principal * Math.pow(1 + annualRate / frequency, frequency * years);
}

export function rdMaturity(monthlyDeposit, annualRate, months) {
  return fvSip(monthlyDeposit, annualRate, months);
}
