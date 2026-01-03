import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format, subDays } from 'date-fns';

interface Transaction {
  txHash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasUsed: string;
  nonce: number;
  status: 'success' | 'failed';
  contractInteraction?: {
    contractAddress: string;
    methodId: string;
    methodName?: string;
    parameters?: Record<string, any>;
    events?: Array<{
      name: string;
      data: Record<string, any>;
    }>;
  };
  tokenTransfers?: Array<{
    tokenAddress: string;
    tokenType: 'ERC20' | 'ERC721' | 'ERC1155';
    from: string;
    to: string;
    value: string;
    tokenId?: string;
  }>;
}

interface Block {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: number;
  miner: string;
  difficulty: string;
  totalDifficulty: string;
  size: number;
  gasUsed: string;
  gasLimit: string;
  baseFeePerGas?: string;
  extraData: string;
  transactions: string[];
}

interface Contract {
  address: string;
  creationTx: string;
  creator: string;
  implementation?: string; // For proxy contracts
  type: 'regular' | 'proxy' | 'token' | 'unknown';
  verified: boolean;
  name?: string;
  version?: string;
  balance: string;
  tokenInfo?: {
    type: 'ERC20' | 'ERC721' | 'ERC1155';
    name: string;
    symbol: string;
    decimals?: number;
    totalSupply?: string;
  };
  statistics: {
    totalTransactions: number;
    uniqueCallers: number;
    failedTransactions: number;
    averageGasUsed: string;
  };
}

interface NetworkMetrics {
  blockTime: number;
  hashRate: string;
  difficulty: string;
  activeAddresses: number;
  pendingTransactions: number;
  averageGasPrice: string;
  totalValueLocked: string;
  dailyTransactions: number;
}

interface SecurityAlert {
  type: 'high' | 'medium' | 'low';
  timestamp: number;
  description: string;
  affectedAddresses: string[];
  recommendation: string;
  signature?: string;
  relatedTxs?: string[];
}

interface BlockchainAnalyticsConfig {
  network: 'mainnet' | 'testnet' | 'local';
  rpcUrl: string;
  apiKey?: string;
  scanPeriod: {
    blocks: number;
    days: number;
  };
  alertThresholds: {
    largeTransactionValue: string;
    highGasPrice: string;
    contractInteractionFrequency: number;
    failedTransactionRate: number;
  };
  monitoredAddresses: string[];
  monitoredContracts: string[];
}

class BlockchainAnalyzer {
  static analyzeTransactionPatterns(transactions: Transaction[]): {
    patterns: Array<{
      type: string;
      frequency: number;
      significance: number;
      description: string;
    }>;
    anomalies: Array<{
      txHash: string;
      type: string;
      severity: number;
      description: string;
    }>;
  } {
    const patterns = [];
    const anomalies = [];

    // Analyze transaction value distribution
    const values = transactions.map(tx => BigInt(tx.value));
    const avgValue = values.reduce((a, b) => a + b, BigInt(0)) / BigInt(values.length);
    
    // Detect high-value transactions
    transactions.forEach(tx => {
      const value = BigInt(tx.value);
      if (value > avgValue * BigInt(10)) {
        anomalies.push({
          txHash: tx.txHash,
          type: 'high-value-transaction',
          severity: 0.8,
          description: `Transaction value significantly higher than average`,
        });
      }
    });

    // Analyze contract interactions
    const contractInteractions = transactions
      .filter(tx => tx.contractInteraction)
      .reduce((acc, tx) => {
        const method = tx.contractInteraction?.methodName || tx.contractInteraction?.methodId;
        acc[method!] = (acc[method!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    Object.entries(contractInteractions).forEach(([method, count]) => {
      patterns.push({
        type: 'contract-interaction',
        frequency: count / transactions.length,
        significance: count > 10 ? 0.7 : 0.3,
        description: `Frequent interaction with method ${method}`,
      });
    });

    // Analyze gas price patterns
    const gasPrices = transactions.map(tx => BigInt(tx.gasPrice));
    const avgGasPrice = gasPrices.reduce((a, b) => a + b, BigInt(0)) / BigInt(gasPrices.length);

    transactions.forEach(tx => {
      const gasPrice = BigInt(tx.gasPrice);
      if (gasPrice > avgGasPrice * BigInt(5)) {
        anomalies.push({
          txHash: tx.txHash,
          type: 'high-gas-price',
          severity: 0.6,
          description: `Gas price significantly higher than average`,
        });
      }
    });

    return { patterns, anomalies };
  }

  static analyzeContractSecurity(contract: Contract, transactions: Transaction[]): {
    riskScore: number;
    vulnerabilities: Array<{
      type: string;
      severity: number;
      description: string;
      recommendation: string;
    }>;
    metrics: {
      interactionComplexity: number;
      failureRate: number;
      avgGasConsumption: string;
    };
  } {
    const vulnerabilities = [];
    let riskScore = 0;

    // Check for proxy patterns
    if (contract.type === 'proxy' && !contract.implementation) {
      vulnerabilities.push({
        type: 'proxy-implementation-missing',
        severity: 0.9,
        description: 'Proxy contract with missing implementation address',
        recommendation: 'Verify proxy implementation address is correctly set',
      });
      riskScore += 0.3;
    }

    // Analyze transaction failure patterns
    const failureRate = contract.statistics.failedTransactions / contract.statistics.totalTransactions;
    if (failureRate > 0.1) {
      vulnerabilities.push({
        type: 'high-failure-rate',
        severity: 0.7,
        description: `High transaction failure rate (${(failureRate * 100).toFixed(2)}%)`,
        recommendation: 'Review contract function requirements and error handling',
      });
      riskScore += 0.2;
    }

    // Analyze gas consumption patterns
    const avgGasUsed = BigInt(contract.statistics.averageGasUsed);
    if (avgGasUsed > BigInt('500000')) {
      vulnerabilities.push({
        type: 'high-gas-consumption',
        severity: 0.5,
        description: 'High average gas consumption',
        recommendation: 'Optimize contract code for gas efficiency',
      });
      riskScore += 0.1;
    }

    return {
      riskScore: Math.min(1, riskScore),
      vulnerabilities,
      metrics: {
        interactionComplexity: contract.statistics.uniqueCallers / contract.statistics.totalTransactions,
        failureRate,
        avgGasConsumption: contract.statistics.averageGasUsed,
      },
    };
  }

  static generateSecurityAlerts(
    transactions: Transaction[],
    contracts: Contract[],
    config: BlockchainAnalyticsConfig
  ): SecurityAlert[] {
    const alerts: SecurityAlert[] = [];

    // Check for large transactions
    transactions.forEach(tx => {
      if (BigInt(tx.value) > BigInt(config.alertThresholds.largeTransactionValue)) {
        alerts.push({
          type: 'high',
          timestamp: tx.timestamp,
          description: 'Large value transaction detected',
          affectedAddresses: [tx.from, tx.to],
          recommendation: 'Verify transaction legitimacy',
          relatedTxs: [tx.txHash],
        });
      }
    });

    // Check for contract vulnerabilities
    contracts.forEach(contract => {
      if (contract.type === 'proxy' && !contract.implementation) {
        alerts.push({
          type: 'high',
          timestamp: Date.now(),
          description: 'Proxy contract with missing implementation',
          affectedAddresses: [contract.address],
          recommendation: 'Verify proxy implementation',
        });
      }
    });

    // Check for unusual activity patterns
    const addressActivity = transactions.reduce((acc, tx) => {
      acc[tx.from] = (acc[tx.from] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(addressActivity).forEach(([address, count]) => {
      if (count > config.alertThresholds.contractInteractionFrequency) {
        alerts.push({
          type: 'medium',
          timestamp: Date.now(),
          description: 'Unusual high frequency of transactions',
          affectedAddresses: [address],
          recommendation: 'Monitor address activity',
        });
      }
    });

    return alerts;
  }
}

const useBlockchainAnalytics = (config: Partial<BlockchainAnalyticsConfig> = {}) => {
  const queryClient = useQueryClient();
  const [activeConfig, setActiveConfig] = useState<BlockchainAnalyticsConfig>({
    network: 'mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/your-api-key',
    scanPeriod: {
      blocks: 1000,
      days: 7,
    },
    alertThresholds: {
      largeTransactionValue: '100000000000000000000', // 100 ETH
      highGasPrice: '500000000000', // 500 Gwei
      contractInteractionFrequency: 100,
      failedTransactionRate: 0.1,
    },
    monitoredAddresses: [],
    monitoredContracts: [],
    ...config,
  });

  const {
    data: blockchainData,
    isLoading,
    error,
  } = useQuery<{
    transactions: Transaction[];
    blocks: Block[];
    contracts: Contract[];
    networkMetrics: NetworkMetrics;
  }>(
    ['blockchainAnalytics', activeConfig],
    async () => {
      const response = await fetch('/api/admin/analytics/blockchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeConfig),
      });
      if (!response.ok) throw new Error('Failed to fetch blockchain analytics data');
      return response.json();
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      keepPreviousData: true,
    }
  );

  const analyses = useMemo(() => {
    if (!blockchainData) return null;

    const { transactions, contracts } = blockchainData;
    const transactionAnalysis = BlockchainAnalyzer.analyzeTransactionPatterns(transactions);
    const contractAnalyses = contracts.map(contract => ({
      address: contract.address,
      analysis: BlockchainAnalyzer.analyzeContractSecurity(contract, transactions),
    }));
    const securityAlerts = BlockchainAnalyzer.generateSecurityAlerts(
      transactions,
      contracts,
      activeConfig
    );

    return {
      transactionAnalysis,
      contractAnalyses,
      securityAlerts,
    };
  }, [blockchainData, activeConfig]);

  const generateReport = useCallback(async () => {
    if (!analyses || !blockchainData) {
      throw new Error('No analyses available for report generation');
    }

    const response = await fetch('/api/admin/analytics/blockchain/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: activeConfig,
        analyses,
        data: blockchainData,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate blockchain analytics report');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blockchain_analytics_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analyses, blockchainData, activeConfig]);

  return {
    config: activeConfig,
    setConfig: setActiveConfig,
    transactions: blockchainData?.transactions || [],
    blocks: blockchainData?.blocks || [],
    contracts: blockchainData?.contracts || [],
    networkMetrics: blockchainData?.networkMetrics,
    analyses,
    isLoading,
    error,
    generateReport,
  };
};

export default useBlockchainAnalytics;
