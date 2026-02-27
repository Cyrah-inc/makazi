import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { formatFullPrice } from '@/lib/formatters';
import { Calculator, TrendingUp, Banknote } from 'lucide-react';

interface MortgageCalculatorProps {
  salePrice: number;
}

const MortgageCalculator = ({ salePrice }: MortgageCalculatorProps) => {
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [loanTermYears, setLoanTermYears] = useState(20);
  const [interestRate, setInterestRate] = useState(14);

  const calculations = useMemo(() => {
    const downPayment = (downPaymentPercent / 100) * salePrice;
    const principal = salePrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const totalPayments = loanTermYears * 12;

    if (principal <= 0 || monthlyRate <= 0) {
      return { monthlyPayment: 0, totalInterest: 0, totalAmount: 0, downPayment, principal };
    }

    const monthlyPayment =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1);

    const totalAmount = monthlyPayment * totalPayments;
    const totalInterest = totalAmount - principal;

    return { monthlyPayment, totalInterest, totalAmount, downPayment, principal };
  }, [salePrice, downPaymentPercent, loanTermYears, interestRate]);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Mortgage Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Down Payment */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground">Down Payment</Label>
            <span className="text-sm font-semibold">{downPaymentPercent}% — {formatFullPrice(calculations.downPayment)}</span>
          </div>
          <Slider
            value={[downPaymentPercent]}
            onValueChange={(v) => setDownPaymentPercent(v[0])}
            min={5}
            max={80}
            step={5}
          />
        </div>

        {/* Loan Term */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground">Loan Term</Label>
            <span className="text-sm font-semibold">{loanTermYears} years</span>
          </div>
          <Slider
            value={[loanTermYears]}
            onValueChange={(v) => setLoanTermYears(v[0])}
            min={5}
            max={30}
            step={1}
          />
        </div>

        {/* Interest Rate */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground">Interest Rate</Label>
            <span className="text-sm font-semibold">{interestRate}%</span>
          </div>
          <Slider
            value={[interestRate]}
            onValueChange={(v) => setInterestRate(v[0])}
            min={5}
            max={25}
            step={0.5}
          />
        </div>

        {/* Results */}
        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Banknote className="h-4 w-4" />
              Monthly Payment
            </span>
            <span className="text-xl font-heading font-bold text-primary">
              {formatFullPrice(Math.round(calculations.monthlyPayment))}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Total Interest
            </span>
            <span className="font-medium text-destructive">
              {formatFullPrice(Math.round(calculations.totalInterest))}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Amount Paid</span>
            <span className="font-medium">
              {formatFullPrice(Math.round(calculations.totalAmount + calculations.downPayment))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MortgageCalculator;
