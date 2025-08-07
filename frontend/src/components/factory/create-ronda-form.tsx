'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  DollarSign,
  ExternalLink,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { INTEREST_PRESETS, InterestPreset } from '@/lib/interest-presets';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ethers } from 'ethers';
import { tokenFormatter } from '@/lib/token-formatter';
import { useFactoryContract } from '@/hooks/use-factory-contract';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Form validation schema
const createRondaSchema = z.object({
  participantCount: z
    .number()
    .min(2, 'Minimum 2 participants')
    .max(50, 'Maximum 50 participants'),
  milestoneCount: z
    .number()
    .min(2, 'Minimum 2 milestones')
    .max(12, 'Maximum 12 milestones'),
  monthlyDeposit: z
    .string()
    .min(1, 'Monthly deposit is required')
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      'Must be a valid positive number'
    ),
  entryFee: z
    .string()
    .min(1, 'Entry fee is required')
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      'Must be a valid positive number'
    ),
  interestDistribution: z.enum(['Conservative', 'Balanced', 'Aggressive']),
  paymentToken: z
    .string()
    .min(1, 'Payment token address is required')
    .refine((val) => ethers.isAddress(val), 'Must be a valid Ethereum address'),
});

type CreateRondaFormData = z.infer<typeof createRondaSchema>;

export function CreateRondaForm() {
  const router = useRouter();
  const [tokenInfo, setTokenInfo] = useState<{
    symbol: string;
    decimals: number;
  } | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [previewDistribution, setPreviewDistribution] = useState<number[]>([]);

  const {
    createRonda,
    isLoading,
    error,
    txHash,
    newRondaAddress,
    estimatedGas,
    estimatedGasCost,
    reset: resetFactory,
  } = useFactoryContract();

  const form = useForm<CreateRondaFormData>({
    resolver: zodResolver(createRondaSchema),
    defaultValues: {
      participantCount: 5,
      milestoneCount: 6,
      monthlyDeposit: '100',
      entryFee: '0.001',
      interestDistribution: 'Balanced',
      paymentToken: CONTRACT_ADDRESSES.MOCK_USDC, // Mock USDC on Hedera Testnet
    },
  });

  const watchedValues = form.watch();

  // Validate token address and get info
  const validateToken = async (address: string) => {
    if (!ethers.isAddress(address)) {
      setTokenError('Invalid address format');
      setTokenInfo(null);
      return;
    }

    setIsValidatingToken(true);
    setTokenError(null);

    try {
      // Use the new direct token info method instead of trying to call paymentToken() on a mock contract
      const info = await tokenFormatter.getTokenInfoFromAddress(address);

      setTokenInfo({
        symbol: info.symbol,
        decimals: info.decimals,
      });
    } catch (error: any) {
      console.error('Token validation error:', error);
      setTokenError('Failed to validate token contract');
      setTokenInfo(null);
    } finally {
      setIsValidatingToken(false);
    }
  };

  // Update interest distribution preview
  useEffect(() => {
    const preset = INTEREST_PRESETS[watchedValues.interestDistribution];
    if (preset && watchedValues.milestoneCount) {
      const distribution = preset.calculate(watchedValues.milestoneCount);
      setPreviewDistribution(distribution);
    }
  }, [watchedValues.interestDistribution, watchedValues.milestoneCount]);

  // Validate token when address changes
  useEffect(() => {
    const address = watchedValues.paymentToken;
    if (address && ethers.isAddress(address)) {
      const timeoutId = setTimeout(() => validateToken(address), 500);
      return () => clearTimeout(timeoutId);
    } else {
      setTokenInfo(null);
      setTokenError(null);
      return;
    }
  }, [watchedValues.paymentToken]);

  const onSubmit = async (data: CreateRondaFormData) => {
    try {
      console.log('🚀 Creating RONDA with data:', data);

      // Calculate interest distribution
      const preset = INTEREST_PRESETS[data.interestDistribution];
      const interestDistribution = preset?.calculate(data.milestoneCount);

      // Convert amounts to wei
      const monthlyDepositWei =
        tokenInfo?.symbol === 'ETH'
          ? ethers.parseEther(data.monthlyDeposit)
          : ethers.parseUnits(data.monthlyDeposit, tokenInfo?.decimals || 6);

      const entryFeeWei = ethers.parseEther(data.entryFee); // Always ETH

      console.log('💰 Converted amounts:', {
        monthlyDepositWei: monthlyDepositWei.toString(),
        entryFeeWei: entryFeeWei.toString(),
        interestDistribution,
      });

      await createRonda({
        participantCount: data.participantCount,
        milestoneCount: data.milestoneCount,
        monthlyDeposit: monthlyDepositWei,
        entryFee: entryFeeWei,
        interestDistribution: interestDistribution || [],
        paymentToken: data.paymentToken,
      });
    } catch (error: any) {
      console.error('❌ Form submission error:', error);
    }
  };

  const handleReset = () => {
    form.reset();
    setTokenInfo(null);
    setTokenError(null);
    setPreviewDistribution([]);
    resetFactory();
  };

  const handleSuccess = () => {
    if (newRondaAddress) {
      router.push(`/group/${newRondaAddress}`);
    }
  };

  // Show success state
  if (newRondaAddress) {
    return (
      <Card className="border-success/20 bg-success/5">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <CardTitle className="text-2xl text-success">
            RONDA Created Successfully!
          </CardTitle>
          <CardDescription>
            Your new RONDA contract has been deployed and is ready for
            participants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-success/20 bg-success/10 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contract Address:</span>
                <span className="font-mono">
                  {newRondaAddress.slice(0, 10)}...{newRondaAddress.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Participants:</span>
                <span className="font-medium">
                  {watchedValues.participantCount} members
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">
                  {watchedValues.milestoneCount} months
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Deposit:</span>
                <span className="font-medium">
                  {watchedValues.monthlyDeposit} {tokenInfo?.symbol || 'MTK'}
                </span>
              </div>
            </div>
          </div>

          {txHash && (
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Transaction Hash</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`https://hashscan.io/testnet/transaction/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button onClick={handleSuccess} className="flex-1">
              View RONDA Details
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Create Another RONDA
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Basic Settings</span>
          </CardTitle>
          <CardDescription>
            Configure the fundamental parameters of your RONDA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="participantCount">Number of Participants</Label>
              <Input
                id="participantCount"
                type="number"
                min={2}
                max={50}
                {...form.register('participantCount', { valueAsNumber: true })}
                className={
                  form.formState.errors.participantCount
                    ? 'border-destructive'
                    : ''
                }
              />
              {form.formState.errors.participantCount && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.participantCount.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Total number of members in the savings circle (2-50)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="milestoneCount">Number of Milestones</Label>
              <Input
                id="milestoneCount"
                type="number"
                min={2}
                max={12}
                {...form.register('milestoneCount', { valueAsNumber: true })}
                className={
                  form.formState.errors.milestoneCount
                    ? 'border-destructive'
                    : ''
                }
              />
              {form.formState.errors.milestoneCount && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.milestoneCount.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Duration in months (2-12)
              </p>
            </div>
          </div>

          {/* Preview Calculation */}
          <div className="rounded-lg bg-muted/30 p-4">
            <h4 className="mb-2 font-medium">RONDA Overview</h4>
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <span className="text-muted-foreground">Total Members:</span>
                <div className="font-medium">
                  {watchedValues.participantCount}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <div className="font-medium">
                  {watchedValues.milestoneCount} months
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Total Rounds:</span>
                <div className="font-medium">
                  {watchedValues.participantCount}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Payout per Round:</span>
                <div className="font-medium">
                  {(
                    parseFloat(watchedValues.monthlyDeposit || '0') *
                    watchedValues.participantCount
                  ).toFixed(2)}{' '}
                  {tokenInfo?.symbol || 'MTK'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Financial Settings</span>
          </CardTitle>
          <CardDescription>
            Set contribution amounts and payment token
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="monthlyDeposit">Monthly Deposit Amount</Label>
              <div className="relative">
                <Input
                  id="monthlyDeposit"
                  type="number"
                  step="0.000001"
                  min="0"
                  {...form.register('monthlyDeposit')}
                  className={
                    form.formState.errors.monthlyDeposit
                      ? 'border-destructive'
                      : ''
                  }
                />
                {tokenInfo && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {tokenInfo.symbol}
                  </div>
                )}
              </div>
              {form.formState.errors.monthlyDeposit && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.monthlyDeposit.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Amount each member contributes monthly
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryFee">Entry Fee</Label>
              <div className="relative">
                <Input
                  id="entryFee"
                  type="number"
                  step="0.000001"
                  min="0"
                  {...form.register('entryFee')}
                  className={
                    form.formState.errors.entryFee ? 'border-destructive' : ''
                  }
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ETH
                </div>
              </div>
              {form.formState.errors.entryFee && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.entryFee.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                One-time fee to join the RONDA (paid in ETH)
              </p>
            </div>
          </div>

          {/* Payment Token */}
          <div className="space-y-2">
            <Label htmlFor="paymentToken">Payment Token Contract Address</Label>
            <Input
              id="paymentToken"
              placeholder="0x..."
              {...form.register('paymentToken')}
              className={`font-mono ${form.formState.errors.paymentToken || tokenError ? 'border-destructive' : ''}`}
            />
            {form.formState.errors.paymentToken && (
              <p className="text-sm text-destructive">
                {form.formState.errors.paymentToken.message}
              </p>
            )}
            {tokenError && (
              <p className="text-sm text-destructive">{tokenError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              ERC20 token contract address for monthly contributions (e.g., MTK
              token)
            </p>
          </div>

          {/* Token Info Display */}
          {isValidatingToken && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Validating token contract...</span>
            </div>
          )}

          {tokenInfo && !isValidatingToken && (
            <div className="rounded-lg border border-success/20 bg-success/5 p-3">
              <div className="mb-2 flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">
                  Token Validated
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Symbol:</span>
                  <div className="font-medium">{tokenInfo.symbol}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Decimals:</span>
                  <div className="font-medium">{tokenInfo.decimals}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Interest Distribution Strategy</span>
          </CardTitle>
          <CardDescription>
            Choose how interest is distributed across milestones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={watchedValues.interestDistribution}
            onValueChange={(value) =>
              form.setValue('interestDistribution', value as any)
            }
            className="space-y-4"
          >
            {Object.entries(INTEREST_PRESETS).map(([key, preset]) => (
              <div key={key} className="flex items-start space-x-3">
                <RadioGroupItem value={key} id={key} className="mt-1" />
                <div className="flex-1 space-y-2">
                  <Label htmlFor={key} className="cursor-pointer">
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {preset.description}
                    </div>
                  </Label>

                  {watchedValues.interestDistribution === key &&
                  previewDistribution.length > 0 ? (
                    <div className="rounded-lg bg-muted/30 p-3">
                      <div className="mb-2 text-sm font-medium">
                        Distribution Preview:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {previewDistribution.map((value, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className={
                              value > 0
                                ? 'border-success text-success'
                                : value < 0
                                  ? 'border-destructive text-destructive'
                                  : ''
                            }
                          >
                            Month {index + 1}: {value > 0 ? '+' : ''}
                            {value}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Sum:{' '}
                        {previewDistribution.reduce((sum, val) => sum + val, 0)}{' '}
                        (must equal 0)
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Gas Estimation */}
      {estimatedGas && estimatedGasCost ? (
        <Card className="border-l-4 border-l-info">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-info" />
              <span className="text-sm font-medium text-info">
                Gas Estimation
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Estimated Gas:</span>
                <div className="font-medium">
                  {estimatedGas.toLocaleString()} units
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Estimated Cost:</span>
                <div className="font-medium">
                  {parseFloat(estimatedGasCost).toFixed(6)} HBAR
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form Actions */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button
          type="submit"
          disabled={isLoading || !tokenInfo || !!tokenError}
          className="flex-1"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating RONDA...
            </>
          ) : (
            <>
              <DollarSign className="mr-2 h-4 w-4" />
              Create RONDA Contract
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isLoading}
          size="lg"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset Form
        </Button>
      </div>

      {/* Form Summary */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="mb-2 text-sm font-medium">Creation Summary</div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div>
              • {watchedValues.participantCount} participants contributing{' '}
              {watchedValues.monthlyDeposit} {tokenInfo?.symbol || 'MTK'}{' '}
              monthly
            </div>
            <div>
              • {watchedValues.milestoneCount} month duration with{' '}
              {watchedValues.interestDistribution} interest distribution
            </div>
            <div>
              • Entry fee of {watchedValues.entryFee} ETH per participant
            </div>
            <div>
              • Total payout per round:{' '}
              {(
                parseFloat(watchedValues.monthlyDeposit || '0') *
                watchedValues.participantCount
              ).toFixed(2)}{' '}
              {tokenInfo?.symbol || 'MTK'}
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
