import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Balance, 
  Plus,
  Eye,
  FileText,
  Search,
  Filter
} from 'lucide-react';

interface Account {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  accountCategory: string;
  accountSubcategory?: string;
  description?: string;
  normalBalance: 'DEBIT' | 'CREDIT';
  isActive: boolean;
  balance?: number;
}

interface Transaction {
  id: string;
  transactionNumber: string;
  transactionDate: string;
  description: string;
  amount: number;
  debitAccount: Account;
  creditAccount: Account;
  referenceType: string;
}

interface FinancialData {
  assets: { total: number; categories: Record<string, any> };
  liabilities: { total: number; categories: Record<string, any> };
  equity: { total: number; categories: Record<string, any> };
  revenue: { total: number; categories: Record<string, any> };
  expenses: { total: number; categories: Record<string, any> };
  netIncome: number;
}

const ChartOfAccountsTab: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});

  const [newAccount, setNewAccount] = useState({
    accountCode: '',
    accountName: '',
    accountType: 'ASSET' as const,
    accountCategory: '',
    accountSubcategory: '',
    description: '',
    normalBalance: 'DEBIT' as const,
    parentAccountId: ''
  });

  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    debitAccountId: '',
    creditAccountId: '',
    referenceType: 'JOURNAL' as const
  });

  useEffect(() => {
    fetchAccounts();
    fetchFinancialDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [activeTab]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/chart-of-accounts/accounts');
      const data = await response.json();
      if (data.success) {
        setAccounts(data.data);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/chart-of-accounts/transactions');
      const data = await response.json();
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchFinancialDashboard = async () => {
    try {
      console.log('🔍 Fetching financial dashboard data...');
      const response = await fetch('/api/chart-of-accounts/dashboard');
      console.log('🔍 Dashboard response:', response);
      const data = await response.json();
      console.log('📊 Dashboard data:', data);
      
      // Store debug info
      setDebugInfo({
        responseStatus: response.status,
        responseOk: response.ok,
        data: data
      });
      
      if (data.success) {
        setFinancialData(data.data);
        console.log('✅ Financial data set:', data.data);
      } else {
        console.error('❌ Dashboard API returned error:', data);
      }
    } catch (error) {
      console.error('❌ Error fetching financial data:', error);
      setDebugInfo(prev => ({ ...prev, error: error.message }));
    }
  };

  const handleCreateAccount = async () => {
    try {
      const response = await fetch('/api/chart-of-accounts/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount)
      });
      
      if (response.ok) {
        setIsCreateDialogOpen(false);
        fetchAccounts();
        setNewAccount({
          accountCode: '',
          accountName: '',
          accountType: 'ASSET',
          accountCategory: '',
          accountSubcategory: '',
          description: '',
          normalBalance: 'DEBIT',
          parentAccountId: ''
        });
      }
    } catch (error) {
      console.error('Error creating account:', error);
    }
  };

  const handleCreateTransaction = async () => {
    try {
      const response = await fetch('/api/chart-of-accounts/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction)
      });
      
      if (response.ok) {
        setIsTransactionDialogOpen(false);
        fetchTransactions();
        fetchFinancialDashboard();
        setNewTransaction({
          description: '',
          amount: '',
          debitAccountId: '',
          creditAccountId: '',
          referenceType: 'JOURNAL'
        });
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.accountCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || account.accountType === filterType;
    return matchesSearch && matchesType;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getAccountTypeColor = (type: string) => {
    const colors = {
      ASSET: 'bg-blue-100 text-blue-800',
      LIABILITY: 'bg-red-100 text-red-800',
      EQUITY: 'bg-green-100 text-green-800',
      REVENUE: 'bg-emerald-100 text-emerald-800',
      EXPENSE: 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading financial data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 border-4 border-blue-500 p-4 rounded-lg">
      {/* Debug Header */}
      <div className="bg-yellow-100 border-2 border-yellow-300 p-3 rounded mb-4">
        <h3 className="font-bold text-yellow-800">🔍 DEBUG MODE ACTIVE</h3>
        <p className="text-sm text-yellow-700">Component updated with debug features - {new Date().toLocaleTimeString()}</p>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Chart of Accounts
            <span className="text-sm font-normal text-gray-500">(Debug Mode)</span>
          </h2>
          <p className="text-muted-foreground">
            Manage your school's financial accounts and transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              console.log('🔄 Manual refresh triggered');
              fetchFinancialDashboard();
              fetchAccounts();
              fetchTransactions();
            }}
          >
            🔄 Refresh Data
          </Button>
          <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Journal Transaction</DialogTitle>
                <DialogDescription>
                  Record a double-entry transaction
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="debitAccount">Debit Account</Label>
                    <Select value={newTransaction.debitAccountId} onValueChange={(value) => setNewTransaction({...newTransaction, debitAccountId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select debit account" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.accountCode} - {account.accountName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="creditAccount">Credit Account</Label>
                    <Select value={newTransaction.creditAccountId} onValueChange={(value) => setNewTransaction({...newTransaction, creditAccountId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select credit account" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.accountCode} - {account.accountName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                    placeholder="Transaction description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateTransaction}>Create Transaction</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Chart Account</DialogTitle>
                <DialogDescription>
                  Add a new account to your chart of accounts
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountCode">Account Code</Label>
                    <Input
                      id="accountCode"
                      value={newAccount.accountCode}
                      onChange={(e) => setNewAccount({...newAccount, accountCode: e.target.value})}
                      placeholder="e.g., 1110"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountType">Account Type</Label>
                    <Select value={newAccount.accountType} onValueChange={(value: any) => setNewAccount({...newAccount, accountType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ASSET">Asset</SelectItem>
                        <SelectItem value="LIABILITY">Liability</SelectItem>
                        <SelectItem value="EQUITY">Equity</SelectItem>
                        <SelectItem value="REVENUE">Revenue</SelectItem>
                        <SelectItem value="EXPENSE">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    value={newAccount.accountName}
                    onChange={(e) => setNewAccount({...newAccount, accountName: e.target.value})}
                    placeholder="e.g., Cash on Hand"
                  />
                </div>
                <div>
                  <Label htmlFor="accountCategory">Category</Label>
                  <Input
                    id="accountCategory"
                    value={newAccount.accountCategory}
                    onChange={(e) => setNewAccount({...newAccount, accountCategory: e.target.value})}
                    placeholder="e.g., Current Assets"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newAccount.description}
                    onChange={(e) => setNewAccount({...newAccount, description: e.target.value})}
                    placeholder="Account description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateAccount}>Create Account</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Debug Info Card */}
          <Card className="border-2 border-red-300">
            <CardHeader className="bg-red-50">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-red-800">
                🔍 Debug Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-semibold text-sm mb-2">API Response:</h4>
                  <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-semibold text-sm mb-2">Financial Data:</h4>
                  <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                    {JSON.stringify(financialData, null, 2)}
                  </pre>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-semibold text-sm mb-2">Accounts Count:</h4>
                  <div className="text-sm">
                    <p>Total Accounts: {accounts.length}</p>
                    <p>Transactions: {transactions.length}</p>
                    <p>Has Financial Data: {financialData ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {!financialData ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-2">No Financial Data Available</h3>
                <p className="text-gray-600 mb-4">
                  Check the debug information above to see API response details
                </p>
                <p className="text-sm text-gray-500">
                  Make sure your chart of accounts has transactions and the API endpoints are working correctly
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">💰 Total Assets</CardTitle>
                    <Balance className="h-4 w-4 text-blue-100" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{formatCurrency(financialData.totalAssets || 0)}</div>
                    <p className="text-xs text-blue-100">
                      {financialData.assets?.categories ? Object.keys(financialData.assets.categories).length : 0} asset categories
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">💳 Total Liabilities</CardTitle>
                    <TrendingDown className="h-4 w-4 text-green-100" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{formatCurrency(financialData.totalLiabilities || 0)}</div>
                    <p className="text-xs text-green-100">
                      {financialData.liabilities?.categories ? Object.keys(financialData.liabilities.categories).length : 0} liability categories
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">📊 Total Equity</CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-100" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{formatCurrency(financialData.totalEquity || 0)}</div>
                    <p className="text-xs text-purple-100">Owner's investment & retained earnings</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white">💵 Net Income</CardTitle>
                    <DollarSign className="h-4 w-4 text-orange-100" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold text-white ${financialData.netIncome > 0 ? 'text-green-300' : financialData.netIncome < 0 ? 'text-red-300' : 'text-white'}`}>
                      {formatCurrency(financialData.netIncome || 0)}
                    </div>
                    <p className="text-xs text-orange-100">
                      {financialData.netIncome > 0 ? '🎉 Profit' : financialData.netIncome < 0 ? '⚠️ Loss' : '📊 Break-even'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Balance Sheet Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold">Assets</h4>
                        {Object.entries(financialData.assets.categories).map(([category, data]: [string, any]) => (
                          <div key={category} className="flex justify-between ml-4">
                            <span>{category}</span>
                            <span>{formatCurrency(data.total)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold mt-2">
                          <span>Total Assets</span>
                          <span>{formatCurrency(financialData.assets.total)}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold">Liabilities & Equity</h4>
                        {Object.entries(financialData.liabilities.categories).map(([category, data]: [string, any]) => (
                          <div key={category} className="flex justify-between ml-4">
                            <span>{category}</span>
                            <span>{formatCurrency(data.total)}</span>
                          </div>
                        ))}
                        {Object.entries(financialData.equity.categories).map(([category, data]: [string, any]) => (
                          <div key={category} className="flex justify-between ml-4">
                            <span>{category}</span>
                            <span>{formatCurrency(data.total)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold mt-2">
                          <span>Total Liabilities & Equity</span>
                          <span>{formatCurrency(financialData.liabilities.total + financialData.equity.total)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Income Statement Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold">Revenue</h4>
                        {Object.entries(financialData.revenue.categories).map(([category, data]: [string, any]) => (
                          <div key={category} className="flex justify-between ml-4">
                            <span>{category}</span>
                            <span>{formatCurrency(data.total)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold mt-2">
                          <span>Total Revenue</span>
                          <span>{formatCurrency(financialData.revenue.total)}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold">Expenses</h4>
                        {Object.entries(financialData.expenses.categories).map(([category, data]: [string, any]) => (
                          <div key={category} className="flex justify-between ml-4">
                            <span>{category}</span>
                            <span>{formatCurrency(data.total)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold mt-2">
                          <span>Total Expenses</span>
                          <span>{formatCurrency(financialData.expenses.total)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Net Income</span>
                        <span>{formatCurrency(financialData.netIncome)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ASSET">Assets</SelectItem>
                <SelectItem value="LIABILITY">Liabilities</SelectItem>
                <SelectItem value="EQUITY">Equity</SelectItem>
                <SelectItem value="REVENUE">Revenue</SelectItem>
                <SelectItem value="EXPENSE">Expenses</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Normal Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.accountCode}</TableCell>
                    <TableCell>{account.accountName}</TableCell>
                    <TableCell>
                      <Badge className={getAccountTypeColor(account.accountType)}>
                        {account.accountType}
                      </Badge>
                    </TableCell>
                    <TableCell>{account.accountCategory}</TableCell>
                    <TableCell>
                      <Badge variant={account.normalBalance === 'DEBIT' ? 'default' : 'secondary'}>
                        {account.normalBalance}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={account.isActive ? 'default' : 'secondary'}>
                        {account.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Transaction #</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Debit Account</TableHead>
                  <TableHead>Credit Account</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.transactionDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{transaction.transactionNumber}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.debitAccount.accountName}</TableCell>
                    <TableCell>{transaction.creditAccount.accountName}</TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.referenceType}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Balance Sheet
                </CardTitle>
                <CardDescription>
                  View your school's financial position at a specific date
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Generate Balance Sheet
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Income Statement
                </CardTitle>
                <CardDescription>
                  View revenue and expenses for a specific period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Generate Income Statement
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChartOfAccountsTab;
