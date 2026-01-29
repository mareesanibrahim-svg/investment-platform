import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle, History, LogOut } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('login'); // login, register, dashboard
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Dashboard States
  const [amount, setAmount] = useState('');
  const [investments, setInvestments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Withdrawal Modal State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [iban, setIban] = useState('');

  // Deposit Modal State
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositMethod, setDepositMethod] = useState('card'); // card, botim
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
      fetchInvestments();
      fetchTransactions();
      setView('dashboard');
    } catch (err) {
      logout();
    }
  };

  const fetchInvestments = async () => {
    try {
      const res = await axios.get(`${API_URL}/investments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvestments(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`${API_URL}/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data);
    } catch (err) { console.error(err); }
  };

  const login = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  const register = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/register`, { name, email, password });
      setView('login');
      setSuccess('Registration successful! Please login.');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setView('login');
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate secure token generation delay
    setTimeout(async () => {
      try {
        // In a real app, this "token" comes from Stripe/Botim SDK
        const fakeToken = `tok_${Math.random().toString(36).substr(2)}`; 
        
        await axios.post(`${API_URL}/deposit`, { 
          amount: parseFloat(amount),
          paymentMethod: depositMethod,
          paymentToken: fakeToken 
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setSuccess(`Deposit successful via ${depositMethod === 'card' ? 'Credit Card' : 'Botim/Payit'}`);
        setAmount('');
        setCardNumber('');
        setExpiry('');
        setCvv('');
        setMobileNumber('');
        setIsDepositModalOpen(false);
        fetchUser();
      } catch (err) {
        setError(err.response?.data?.error || 'Deposit failed');
      } finally {
        setIsProcessing(false);
      }
    }, 2000); // 2 second processing simulation
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/withdraw`, { 
        amount: parseFloat(amount),
        bankName,
        accountHolder,
        iban
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Withdrawal request submitted successfully');
      setAmount('');
      setBankName('');
      setAccountHolder('');
      setIban('');
      setIsWithdrawModalOpen(false);
      fetchUser();
    } catch (err) {
      setError(err.response?.data?.error || 'Withdrawal failed');
    }
  };

  const handleInvest = async () => {
    try {
      await axios.post(`${API_URL}/invest`, { amount: parseFloat(amount) }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Investment started successfully');
      setAmount('');
      fetchUser();
    } catch (err) {
      setError(err.response?.data?.error || 'Investment failed');
    }
  };

  const claimProfit = async (id) => {
    try {
      const res = await axios.post(`${API_URL}/claim`, { investmentId: id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(res.data.message);
      fetchUser();
    } catch (err) {
      setError(err.response?.data?.error || 'Claim failed');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">InvestApp</h1>
          {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{error}</div>}
          {success && <div className="bg-green-100 text-green-700 p-2 mb-4 rounded">{success}</div>}
          
          {view === 'login' ? (
            <form onSubmit={login}>
              <h2 className="text-xl mb-4">Login</h2>
              <input className="w-full mb-3 p-2 border rounded" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
              <input className="w-full mb-4 p-2 border rounded" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
              <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Login</button>
              <p className="mt-4 text-center text-sm">
                Don't have an account? <span className="text-blue-600 cursor-pointer" onClick={() => setView('register')}>Register</span>
              </p>
            </form>
          ) : (
            <form onSubmit={register}>
              <h2 className="text-xl mb-4">Register</h2>
              <input className="w-full mb-3 p-2 border rounded" type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
              <input className="w-full mb-3 p-2 border rounded" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
              <input className="w-full mb-4 p-2 border rounded" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
              <button className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">Register</button>
              <p className="mt-4 text-center text-sm">
                Already have an account? <span className="text-blue-600 cursor-pointer" onClick={() => setView('login')}>Login</span>
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
          <TrendingUp /> InvestApp
        </h1>
        <div className="flex items-center gap-4">
          <span className="font-medium text-gray-700">Balance: {user?.balance?.toFixed(2)} AED</span>
          <button onClick={logout} className="text-gray-500 hover:text-red-600"><LogOut size={20} /></button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-3 rounded">{success}</div>}

        {/* Action Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Wallet size={20}/> Wallet Actions</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Amount (AED)</label>
              <input 
                type="number" 
                className="w-full p-2 border rounded" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                placeholder="Enter amount"
              />
            </div>
            <button onClick={() => setIsDepositModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2">
              <ArrowDownCircle size={18} /> Deposit
            </button>
            <button onClick={() => setIsWithdrawModalOpen(true)} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2">
              <ArrowUpCircle size={18} /> Withdraw
            </button>
            <button onClick={handleInvest} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
              <TrendingUp size={18} /> Invest (Min 15)
            </button>
          </div>
        </div>

        {/* Active Investments */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Active Investments</h2>
            <button onClick={fetchInvestments} className="text-sm text-blue-600 hover:underline">Refresh</button>
          </div>
          {investments.length === 0 ? (
            <p className="text-gray-500">No active investments.</p>
          ) : (
            <div className="space-y-3">
              {investments.map(inv => (
                <div key={inv.id} className="border p-4 rounded flex justify-between items-center">
                  <div>
                    <p className="font-medium">{inv.amount} AED</p>
                    <p className="text-sm text-gray-500">Started: {new Date(inv.start_time).toLocaleString()}</p>
                    <p className="text-sm text-green-600">Pending Profit: +{inv.pending_profit?.toFixed(2)} AED</p>
                  </div>
                  <button 
                    onClick={() => claimProfit(inv.id)}
                    className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                    disabled={inv.pending_profit < 0.01}
                  >
                    Claim Profit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><History size={20}/> History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} className="border-b last:border-0">
                    <td className="p-3 capitalize">{tx.type}</td>
                    <td className={`p-3 font-medium ${tx.type === 'withdraw' || tx.type === 'invest' ? 'text-red-600' : 'text-green-600'}`}>
                      {tx.type === 'withdraw' || tx.type === 'invest' ? '-' : '+'}{tx.amount} AED
                    </td>
                    <td className="p-3 text-gray-500">{new Date(tx.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Deposit Modal */}
        {isDepositModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ArrowDownCircle className="text-green-600"/> Deposit Funds
              </h2>
              
              {/* Payment Method Tabs */}
              <div className="flex mb-6 border-b">
                <button 
                  className={`flex-1 pb-2 ${depositMethod === 'card' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}
                  onClick={() => setDepositMethod('card')}
                >
                  Credit/Debit Card
                </button>
                <button 
                  className={`flex-1 pb-2 ${depositMethod === 'botim' ? 'border-b-2 border-blue-600 font-bold text-blue-600' : 'text-gray-500'}`}
                  onClick={() => setDepositMethod('botim')}
                >
                  Botim / Payit
                </button>
              </div>

              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount (AED)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    className="w-full p-2 border rounded mt-1" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    placeholder="Enter amount"
                  />
                </div>

                {depositMethod === 'card' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Card Number</label>
                      <input 
                        type="text" 
                        required
                        className="w-full p-2 border rounded mt-1" 
                        value={cardNumber} 
                        onChange={e => setCardNumber(e.target.value.replace(/\D/g,'').substring(0,16))} 
                        placeholder="XXXX XXXX XXXX XXXX"
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Expiry</label>
                        <input 
                          type="text" 
                          required
                          className="w-full p-2 border rounded mt-1" 
                          value={expiry} 
                          onChange={e => setExpiry(e.target.value)} 
                          placeholder="MM/YY"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">CVV</label>
                        <input 
                          type="password" 
                          required
                          className="w-full p-2 border rounded mt-1" 
                          value={cvv} 
                          onChange={e => setCvv(e.target.value.substring(0,3))} 
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mobile Number (Linked to Wallet)</label>
                    <div className="flex gap-2">
                      <span className="p-2 bg-gray-100 border rounded mt-1 text-gray-600">+971</span>
                      <input 
                        type="text" 
                        required
                        className="w-full p-2 border rounded mt-1" 
                        value={mobileNumber} 
                        onChange={e => setMobileNumber(e.target.value.replace(/\D/g,'').substring(0,9))} 
                        placeholder="50 123 4567"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setIsDepositModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Pay Securely'}
                  </button>
                </div>
                
                <p className="text-xs text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span> 
                  256-bit SSL Encrypted Payment
                </p>
              </form>
            </div>
          </div>
        )}

        {/* Withdrawal Modal */}
        {isWithdrawModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ArrowUpCircle className="text-red-500"/> Withdraw Funds
              </h2>
              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount (AED)</label>
                  <input 
                    type="number" 
                    required
                    className="w-full p-2 border rounded mt-1" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    placeholder="Enter amount to withdraw"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-2 border rounded mt-1" 
                    value={bankName} 
                    onChange={e => setBankName(e.target.value)} 
                    placeholder="e.g. Emirates NBD"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Holder Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-2 border rounded mt-1" 
                    value={accountHolder} 
                    onChange={e => setAccountHolder(e.target.value)} 
                    placeholder="Full Name on Account"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">IBAN</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-2 border rounded mt-1" 
                    value={iban} 
                    onChange={e => setIban(e.target.value)} 
                    placeholder="AE..."
                    pattern="^AE\d{21}$"
                    title="Must start with AE followed by 21 digits"
                  />
                  <p className="text-xs text-gray-500 mt-1">UAE IBAN format: AE followed by 21 digits</p>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setIsWithdrawModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Confirm Withdrawal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
