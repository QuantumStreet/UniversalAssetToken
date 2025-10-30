"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { YieldCalculatorModal, YieldCalculation } from "@/components/charts/yield-calculator-modal";
import { PropertyDetails, TrustConfiguration, BeneficiaryRights } from "@/types/wizard";
import { BusinessData } from "@/types/business";
import { useAssetType } from "@/contexts/asset-type-context";
import { Building, Users, Calendar, Percent, Sparkles, ChevronLeft, Coins, TrendingUp, Zap } from "lucide-react";

type TrustConfigurationStepProps = {
  propertyData?: PropertyDetails;
  businessData?: BusinessData;
  data?: TrustConfiguration;
  onComplete: (data: TrustConfiguration & BeneficiaryRights) => void;
  onBack: () => void;
};

export function TrustConfigurationStep({ propertyData, businessData, data, onComplete, onBack }: TrustConfigurationStepProps) {
  const { assetType } = useAssetType();
  const [formData, setFormData] = useState<Partial<TrustConfiguration & BeneficiaryRights>>(data || {
    trustDuration: 1000,
    annualDistributionRate: 75,
    reserveFundRate: 20,
    trusteeFeeRate: 5,
    minimumPurchase: 1
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);
  const [showYieldModal, setShowYieldModal] = useState(false);
  const [yieldCalculation, setYieldCalculation] = useState<YieldCalculation | null>(null);

  // Generate random names
  const generateRandomName = () => {
    const firstNames = ['Alexander', 'Benjamin', 'Charlotte', 'Diana', 'Eleanor', 'Frederick', 'Georgia', 'Harrison', 'Isabella', 'James'];
    const lastNames = ['Anderson', 'Bennett', 'Carter', 'Davidson', 'Edwards', 'Franklin', 'Graham', 'Harrison', 'Irving', 'Jackson'];
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${first} ${last}`;
  };

  // Use Preset button handler
  const handleUsePreset = () => {
    setFormData(prev => ({
      ...prev,
      trustName: 'Quantum Street Trust',
      settlorName: generateRandomName(),
      trusteeName: generateRandomName()
    }));
  };

  // Generate smart token name and symbol based on asset data
  const generateTokenSuggestion = () => {
    if (assetType === "property" && propertyData?.propertyAddress) {
      // Property-based token generation
      const address = propertyData.propertyAddress;
      const city = propertyData.city || '';
      
      // Try to extract street name
      const streetMatch = address.match(/\d+\s+([A-Za-z\s]+)/);
      const streetName = streetMatch ? streetMatch[1].trim().split(' ')[0] : city;
      
      // Generate token name
      const tokenName = `${streetName || 'Asset'} Token`;
      
      // Generate symbol (first letters)
      const symbolParts = streetName ? streetName.substring(0, 3).toUpperCase() : 'AST';
      const tokenSymbol = symbolParts + 'T';

      setFormData(prev => ({
        ...prev,
        tokenName: prev.tokenName || tokenName,
        tokenSymbol: prev.tokenSymbol || tokenSymbol
      }));
    } else if (assetType === "business" && businessData?.companyName) {
      // Business-based token generation
      const companyName = businessData.companyName;
      
      // Extract key words from company name
      const words = companyName.split(' ').filter(word => 
        !['Inc', 'LLC', 'Corp', 'Corporation', 'Company', 'Ltd', 'Limited'].includes(word)
      );
      const primaryWord = words[0] || 'Business';
      
      // Generate token name
      const tokenName = `${primaryWord} Token`;
      
      // Generate symbol (first letters)
      const symbolParts = primaryWord.substring(0, 3).toUpperCase();
      const tokenSymbol = symbolParts + 'T';

      setFormData(prev => ({
        ...prev,
        tokenName: prev.tokenName || tokenName,
        tokenSymbol: prev.tokenSymbol || tokenSymbol
      }));
    }
  };

  // Auto-calculate token supply and price based on asset value
  useEffect(() => {
    if (assetType === "property" && propertyData?.propertyValue) {
      const suggestedSupply = propertyData.totalSquareFootage || 10000;
      const suggestedPrice = Math.round(propertyData.propertyValue / suggestedSupply);
      
      setFormData(prev => ({
        ...prev,
        tokenSupply: prev.tokenSupply || suggestedSupply,
        tokenPrice: prev.tokenPrice || suggestedPrice
      }));
    } else if (assetType === "business" && businessData?.aiEstimatedValue) {
      // For business, use estimated value to calculate token price
      const suggestedSupply = 10000; // Default supply for business tokens
      const suggestedPrice = Math.round(businessData.aiEstimatedValue / suggestedSupply);
      
      setFormData(prev => ({
        ...prev,
        tokenSupply: prev.tokenSupply || suggestedSupply,
        tokenPrice: prev.tokenPrice || suggestedPrice
      }));
    }
  }, [propertyData, businessData, assetType]);

  // Auto-suggest token name and symbol when asset data is available
  useEffect(() => {
    if (assetType === "property" && propertyData?.propertyAddress && !formData.tokenName && !formData.tokenSymbol) {
      generateTokenSuggestion();
    } else if (assetType === "business" && businessData?.companyName && !formData.tokenName && !formData.tokenSymbol) {
      generateTokenSuggestion();
    }
  }, [propertyData, businessData, assetType, formData.tokenName, formData.tokenSymbol]);

  const handlePreviewReturns = () => {
    // Use default values if not set yet
    const tokenSupply = formData.tokenSupply || 10000;
    let tokenPrice = formData.tokenPrice || 100;
    let assetValue = 0;
    let annualIncome = 0;

    if (assetType === "property" && propertyData?.propertyValue) {
      tokenPrice = formData.tokenPrice || Math.round(propertyData.propertyValue / tokenSupply);
      assetValue = propertyData.propertyValue;
      annualIncome = propertyData.annualRentalIncome || propertyData.netIncome || (propertyData.propertyValue * 0.05);
    } else if (assetType === "business" && businessData?.aiEstimatedValue) {
      tokenPrice = formData.tokenPrice || Math.round(businessData.aiEstimatedValue / tokenSupply);
      assetValue = businessData.aiEstimatedValue;
      annualIncome = businessData.annualRevenue || (businessData.aiEstimatedValue * 0.1); // Estimate 10% revenue
    } else {
      // No asset data available
      alert(`Please complete Step 1 (${assetType === "property" ? "Property" : "Business"} Details) first`);
      return;
    }

    // Calculate yield projections
    const expenses = annualIncome * 0.15; // Estimate 15% expenses
    const netIncome = annualIncome - expenses;

    const distributionRate = formData.annualDistributionRate || 75;
    const reserveRate = formData.reserveFundRate || 20;
    const feeRate = formData.trusteeFeeRate || 5;

    const distributionPool = (netIncome * distributionRate) / 100;
    const reserveFund = (netIncome * reserveRate) / 100;
    const trusteeFees = (netIncome * feeRate) / 100;

    const yieldPerToken = distributionPool / tokenSupply;
    const monthlyYield = yieldPerToken / 12;
    const annualReturn = (yieldPerToken / tokenPrice) * 100;

    setYieldCalculation({
      tokenPrice: tokenPrice,
      yieldPerToken,
      monthlyYield,
      annualReturn,
      distributionPool,
      reserveFund,
      trusteeFees
    });

    setShowYieldModal(true);
  };

  const handleAIOptimization = async () => {
    if (assetType === "property" && !propertyData) return;
    if (assetType === "business" && !businessData) return;

    setIsOptimizing(true);
    try {
      // TODO: Call AI API for trust optimization
      // const response = await fetch('/api/ai/optimize-trust', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     assetValue: assetType === "property" ? propertyData?.propertyValue : businessData?.aiEstimatedValue,
      //     netIncome: assetType === "property" ? propertyData?.netIncome : businessData?.annualRevenue,
      //     assetType: assetType
      //   })
      // });
      
      // Simulate AI recommendations
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      let optimalDistribution = 90;
      let reasoning = "";
      
      if (assetType === "property" && propertyData) {
        optimalDistribution = propertyData.netIncome 
          ? Math.min(95, Math.round((propertyData.netIncome / propertyData.propertyValue) * 100 * 0.9))
          : 90;
        reasoning = `Based on property value of $${propertyData.propertyValue.toLocaleString()} and annual income of $${propertyData.netIncome?.toLocaleString() || 0}, we recommend ${optimalDistribution}% distribution to maximize returns while maintaining a healthy reserve.`;
      } else if (assetType === "business" && businessData) {
        const estimatedValue = businessData.aiEstimatedValue || 0;
        const annualRevenue = businessData.annualRevenue || 0;
        optimalDistribution = annualRevenue 
          ? Math.min(95, Math.round((annualRevenue / estimatedValue) * 100 * 0.8))
          : 85;
        reasoning = `Based on business valuation of $${estimatedValue.toLocaleString()} and annual revenue of $${annualRevenue.toLocaleString()}, we recommend ${optimalDistribution}% distribution to maximize returns while maintaining business growth reserves.`;
      }
      
      const recommendations = {
        annualDistributionRate: optimalDistribution,
        reserveFundRate: 10,
        trusteeFeeRate: 1,
        reasoning: reasoning
      };
      
      setAiRecommendations(recommendations);
      setFormData(prev => ({
        ...prev,
        ...recommendations
      }));
    } catch (error) {
      console.error('AI optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.trustName || !formData.settlorName || !formData.trusteeName) {
      alert("Please fill in all required fields");
      return;
    }

    onComplete(formData as TrustConfiguration & BeneficiaryRights);
  };

  const handleBack = () => {
    // Save partial data before going back
    if (formData.trustName || formData.tokenName || formData.tokenSupply) {
      onComplete(formData as TrustConfiguration & BeneficiaryRights);
    }
    onBack();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Trust Information */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[var(--color-foreground)] flex items-center gap-2">
            <Building className="h-5 w-5 text-[var(--accent)]" />
            Trust Information
          </h3>
          <Button
            type="button"
            onClick={handleUsePreset}
            className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-400 flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Use Preset
          </Button>
        </div>
        
        <div className="space-y-3">
          <label className="text-sm font-medium text-cyan-200">
            Trust Name *
          </label>
          <input
            type="text"
            value={formData.trustName || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, trustName: e.target.value }))}
            placeholder={assetType === "property" ? "My Family Property Trust" : "My Business Investment Trust"}
            className="w-full rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-cyan-200">
              Settlor Name *
            </label>
            <input
              type="text"
              value={formData.settlorName || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, settlorName: e.target.value }))}
              placeholder="John Doe"
              className="w-full rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-cyan-200">
              Trustee Name *
            </label>
            <input
              type="text"
              value={formData.trusteeName || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, trusteeName: e.target.value }))}
              placeholder="Trust Company LLC"
              className="w-full rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              required
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-cyan-200 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Trust Duration (years)
          </label>
          <input
            type="number"
            value={formData.trustDuration || 1000}
            onChange={(e) => setFormData(prev => ({ ...prev, trustDuration: Number(e.target.value) }))}
            placeholder="1000"
            className="w-full rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          />
          <p className="text-xs text-[var(--muted)]">Wyoming Trusts support up to 1,000 years</p>
        </div>
      </div>

      {/* AI Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AI Optimization */}
        <div className="rounded-2xl border border-[var(--accent)]/30 bg-[rgba(34,211,238,0.08)] p-6">
          <div className="flex flex-col gap-4">
            <h4 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--accent)]" />
              AI Trust Optimization
            </h4>
            <p className="text-sm text-[var(--muted)]">
              Let AI recommend optimal distribution rates and token configuration
            </p>
            <Button
              type="button"
              onClick={handleAIOptimization}
              disabled={isOptimizing}
              className="bg-[var(--accent)]/20 hover:bg-[var(--accent)]/30 border border-[var(--accent)]/40 text-[var(--accent)] w-full"
            >
              {isOptimizing ? "Optimizing..." : "Get AI Recommendations"}
            </Button>
          </div>
        </div>

        {/* Yield Preview */}
        <div className="rounded-2xl border border-green-500/30 bg-green-900/10 p-6">
          <div className="flex flex-col gap-4">
            <h4 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Preview Token Returns
            </h4>
            <p className="text-sm text-[var(--muted)]">
              See projected yield and ROI for each token with current configuration
            </p>
            <Button
              type="button"
              onClick={handlePreviewReturns}
              className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 w-full"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Calculate Returns
            </Button>
          </div>
        </div>
      </div>

      {/* AI Recommendations Display */}
      {aiRecommendations && (
        <div className="rounded-2xl border border-[var(--accent)]/30 bg-[rgba(34,211,238,0.08)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--accent)]" />
              AI Recommendations
            </h4>
          </div>
        
          <div className="p-4 rounded-xl bg-[rgba(6,11,26,0.6)] border border-[var(--accent)]/20">
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              {aiRecommendations.reasoning}
            </p>
          </div>
        </div>
      )}

      {/* Financial Configuration */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[var(--color-foreground)] flex items-center gap-2">
          <Percent className="h-5 w-5 text-[var(--accent)]" />
          Financial Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-cyan-200">
              Annual Distribution (%)
            </label>
            <input
              type="number"
              value={formData.annualDistributionRate || 75}
              onChange={(e) => setFormData(prev => ({ ...prev, annualDistributionRate: Number(e.target.value) }))}
              min="0"
              max="100"
              className="w-full rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] px-4 py-3 text-[var(--color-foreground)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-cyan-200">
              Reserve Fund (%)
            </label>
            <input
              type="number"
              value={formData.reserveFundRate || 20}
              onChange={(e) => setFormData(prev => ({ ...prev, reserveFundRate: Number(e.target.value) }))}
              min="0"
              max="100"
              className="w-full rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] px-4 py-3 text-[var(--color-foreground)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-cyan-200">
              Trustee Fee (%)
            </label>
            <input
              type="number"
              value={formData.trusteeFeeRate || 5}
              onChange={(e) => setFormData(prev => ({ ...prev, trusteeFeeRate: Number(e.target.value) }))}
              min="0"
              max="100"
              step="0.1"
              className="w-full rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] px-4 py-3 text-[var(--color-foreground)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </div>
        </div>
      </div>

      {/* Token Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[var(--color-foreground)] flex items-center gap-2">
            <Coins className="h-5 w-5 text-[var(--accent)]" />
            Token Configuration
          </h3>
          <Button
            type="button"
            onClick={generateTokenSuggestion}
            disabled={assetType === "property" ? !propertyData?.propertyAddress : !businessData?.companyName}
            className="bg-[var(--accent)]/20 hover:bg-[var(--accent)]/30 border border-[var(--accent)]/40 text-[var(--accent)] flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Generate Suggestion
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-cyan-200">
              Token Name *
            </label>
            <input
              type="text"
              value={formData.tokenName || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, tokenName: e.target.value }))}
              placeholder={assetType === "property" ? "Property Trust Token" : "Business Trust Token"}
              className="w-full rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-cyan-200">
              Token Symbol *
            </label>
            <input
              type="text"
              value={formData.tokenSymbol || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, tokenSymbol: e.target.value.toUpperCase() }))}
              placeholder="PTT"
              maxLength={10}
              className="w-full rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-cyan-200">
              Token Supply *
            </label>
            <input
              type="number"
              value={formData.tokenSupply || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, tokenSupply: Number(e.target.value) }))}
              placeholder="10000"
              className="w-full rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              required
            />
            {assetType === "property" && propertyData?.totalSquareFootage && (
              <p className="text-xs text-[var(--muted)]">
                💡 Based on {propertyData.totalSquareFootage.toLocaleString()} sq ft (1 token = 1 sq ft)
              </p>
            )}
            {assetType === "business" && businessData?.aiEstimatedValue && (
              <p className="text-xs text-[var(--muted)]">
                💡 Based on business valuation of ${businessData.aiEstimatedValue.toLocaleString()}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-cyan-200">
              Price per Token ($) *
            </label>
            <input
              type="number"
              value={formData.tokenPrice || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, tokenPrice: Number(e.target.value) }))}
              placeholder="75"
              className="w-full rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              required
            />
            {assetType === "property" && propertyData?.propertyValue && formData.tokenSupply && (
              <p className="text-xs text-[var(--muted)]">
                💡 Based on ${propertyData.propertyValue.toLocaleString()} property value ÷ {formData.tokenSupply.toLocaleString()} tokens
              </p>
            )}
            {assetType === "business" && businessData?.aiEstimatedValue && formData.tokenSupply && (
              <p className="text-xs text-[var(--muted)]">
                💡 Based on ${businessData.aiEstimatedValue.toLocaleString()} business value ÷ {formData.tokenSupply.toLocaleString()} tokens
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-cyan-200">
              Minimum Purchase
            </label>
            <input
              type="number"
              value={formData.minimumPurchase || 1}
              onChange={(e) => setFormData(prev => ({ ...prev, minimumPurchase: Number(e.target.value) }))}
              placeholder="1"
              className="w-full rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </div>
        </div>

        {/* Calculated Values */}
        {formData.tokenSupply && formData.tokenPrice && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 rounded-xl bg-[rgba(34,211,238,0.08)] border border-[var(--accent)]/20">
              <p className="text-xs text-[var(--muted)] mb-1">Total Token Value</p>
              <p className="text-2xl font-bold text-[var(--accent)]">
                ${(formData.tokenSupply * formData.tokenPrice).toLocaleString()}
              </p>
            </div>
            {assetType === "property" && propertyData?.netIncome && formData.annualDistributionRate && (
              <div className="p-4 rounded-xl bg-[rgba(34,211,238,0.08)] border border-[var(--accent)]/20">
                <p className="text-xs text-[var(--muted)] mb-1">Projected Annual Distribution</p>
                <p className="text-2xl font-bold text-[var(--accent)]">
                  ${Math.round(propertyData.netIncome * (formData.annualDistributionRate / 100)).toLocaleString()}
                </p>
              </div>
            )}
            {assetType === "business" && businessData?.annualRevenue && formData.annualDistributionRate && (
              <div className="p-4 rounded-xl bg-[rgba(34,211,238,0.08)] border border-[var(--accent)]/20">
                <p className="text-xs text-[var(--muted)] mb-1">Projected Annual Distribution</p>
                <p className="text-2xl font-bold text-[var(--accent)]">
                  ${Math.round(businessData.annualRevenue * (formData.annualDistributionRate / 100)).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Beneficiary Rights */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[var(--color-foreground)] flex items-center gap-2">
          <Users className="h-5 w-5 text-[var(--accent)]" />
          Beneficiary Rights
        </h3>

        <div className="space-y-3">
          <label className="flex items-center gap-3 p-4 rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.6)] cursor-pointer hover:border-[var(--accent)]/30 transition">
            <input
              type="checkbox"
              checked={formData.occupancyRights || false}
              onChange={(e) => setFormData(prev => ({ ...prev, occupancyRights: e.target.checked }))}
              className="w-5 h-5 rounded border-[var(--accent)]/50 bg-[rgba(6,11,26,0.8)] checked:bg-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
            <div>
              <p className="text-sm font-medium text-[var(--color-foreground)]">
                {assetType === "property" ? "Occupancy Rights" : "Usage Rights"}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {assetType === "property" 
                  ? "Token holders can occupy the property based on ownership percentage"
                  : "Token holders can use business services based on ownership percentage"
                }
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.6)] cursor-pointer hover:border-[var(--accent)]/30 transition">
            <input
              type="checkbox"
              checked={formData.votingRights || false}
              onChange={(e) => setFormData(prev => ({ ...prev, votingRights: e.target.checked }))}
              className="w-5 h-5 rounded border-[var(--accent)]/50 bg-[rgba(6,11,26,0.8)] checked:bg-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
            <div>
              <p className="text-sm font-medium text-[var(--color-foreground)]">Voting Rights</p>
              <p className="text-xs text-[var(--muted)]">
                {assetType === "property" 
                  ? "Token holders can vote on property decisions"
                  : "Token holders can vote on business decisions"
                }
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.6)] cursor-pointer hover:border-[var(--accent)]/30 transition">
            <input
              type="checkbox"
              checked={formData.transferRights || false}
              onChange={(e) => setFormData(prev => ({ ...prev, transferRights: e.target.checked }))}
              className="w-5 h-5 rounded border-[var(--accent)]/50 bg-[rgba(6,11,26,0.8)] checked:bg-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
            <div>
              <p className="text-sm font-medium text-[var(--color-foreground)]">Transfer Rights</p>
              <p className="text-xs text-[var(--muted)]">Token holders can freely transfer their tokens</p>
            </div>
          </label>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          onClick={handleBack}
          variant="outline"
          className="border-[var(--color-card-border)]/50 hover:border-[var(--accent)]/50 text-[var(--muted)] hover:text-[var(--color-foreground)]"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          type="submit"
          className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[#041321] font-semibold px-8"
        >
          Continue to Contract Generation
        </Button>
      </div>

      {/* Yield Calculator Modal */}
      {yieldCalculation && (
        <YieldCalculatorModal
          isOpen={showYieldModal}
          onClose={() => setShowYieldModal(false)}
          calculation={yieldCalculation}
          tokenSupply={formData.tokenSupply || 1}
        />
      )}
    </form>
  );
}

