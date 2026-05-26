// frontend/src/pages/TrialBalance.js
import React, { useEffect, useState } from 'react';
import api from '../api';
import '../styles/Common.css';

const TrialBalance = () => {
  const [trialBalance, setTrialBalance] = useState([]);
  const [period, setPeriod] = useState('2026-04');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accountNames, setAccountNames] = useState({}); // Map of account code to name

  // Fetch GL account names on component mount
  useEffect(() => {
    fetchAccountNames();
  }, []);

  useEffect(() => {
    loadTrialBalance();
  }, [period]);

  const fetchAccountNames = async () => {
    try {
      // Try to get GL accounts - adjust the endpoint based on your API
      const res = await api.get('/gl-accounts');
      
      // Create a map of account code to account name
      const nameMap = {};
      if (Array.isArray(res.data)) {
        res.data.forEach(account => {
          // Handle different possible field names
          const code = account.glCode || account.accountCode || account.code;
          const name = account.name || account.accountName || account.glName;
          if (code && name) {
            nameMap[code] = name;
          }
        });
      }
      setAccountNames(nameMap);
      console.log('Account names loaded:', nameMap); // Debug
    } catch (err) {
      console.error('Error fetching account names:', err);
      // If GL accounts endpoint doesn't exist, try chart of accounts
      try {
        const res = await api.get('/chart-of-accounts');
        const nameMap = {};
        if (Array.isArray(res.data)) {
          res.data.forEach(account => {
            const code = account.glCode || account.accountCode || account.code;
            const name = account.name || account.accountName || account.glName;
            if (code && name) {
              nameMap[code] = name;
            }
          });
        }
        setAccountNames(nameMap);
      } catch (err2) {
        console.error('Error fetching chart of accounts:', err2);
      }
    }
  };

  // Generate period options dynamically
  const generatePeriodOptions = () => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    for (let i = 0; i < 12; i++) {
      let year = currentYear;
      let month = currentMonth - i;
      
      if (month <= 0) {
        month += 12;
        year -= 1;
      }
      
      const periodValue = `${year}-${String(month).padStart(2, '0')}`;
      const date = new Date(year, month - 1);
      const monthName = date.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
      
      options.push({
        value: periodValue,
        label: monthName
      });
    }

    return options;
  };

  const periodOptions = generatePeriodOptions();

  const loadTrialBalance = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/trial-balance/${period}`);
      console.log('Trial Balance Data:', res.data);
      setTrialBalance(res.data);
    } catch (err) {
      console.error('Error loading trial balance:', err);
      setError(err.response?.data?.message || 'Failed to load trial balance');
      setTrialBalance([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals correctly
  const grandTotalDebit = trialBalance.reduce((sum, row) => sum + Number(row.debit || 0), 0);
  const grandTotalCredit = trialBalance.reduce((sum, row) => sum + Number(row.credit || 0), 0);
  
  const difference = Math.abs(grandTotalDebit - grandTotalCredit);
  const isBalanced = difference <= 0.01;

  const formatCurrency = (amount) => {
    return Number(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getPeriodDisplay = () => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  };

  // Get account name from the map
  const getAccountName = (accountCode) => {
    return accountNames[accountCode] || getDefaultAccountName(accountCode) || '';
  };

  // Fallback account names based on common GL codes
  const getDefaultAccountName = (code) => {
    const defaultNames = {
      '001': 'Cash Account',
      '100001': 'Bank Account',
      '100002': 'Petty Cash',
      '110001': 'GST Input',
      '120001': 'Accounts Receivable',
      '200001': 'Accounts Payable',
      '210001': 'GST Output',
      '210002': 'TDS Payable',
      '210003': 'TDS Receivable',
      '210004': 'Provisions',
      '300001': 'Sales Revenue',
      '310001': 'Service Revenue',
      '400001': 'Income Account',
      '500001': 'Rent Expense',
      '500002': 'Salary Expense',
      '500003': 'Utility Expense',
      '500004': 'Office Expense',
      '500005': 'Travel Expense',
      '500006': 'Marketing Expense',
    };
    return defaultNames[code] || '';
  };

  return (
    <div>
      <h2>Trial Balance</h2>
      {error && <div className="error-text">{error}</div>}
      
      <div className="card">
        <div className="form-group">
          <label>Period</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button 
            className="btn-primary btn-small" 
            onClick={loadTrialBalance} 
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {loading && <div className="loading-text">Loading trial balance...</div>}

      {!loading && trialBalance.length > 0 && (
        <div className="card full-width">
          <h3>Trial Balance - {getPeriodDisplay()}</h3>
          <div className="table-responsive">
            <table className="table trial-balance">
              <thead>
                <tr>
                  <th>Account Code</th>
                  <th>Account Name</th>
                  <th className="amount-col">Debit (₹)</th>
                  <th className="amount-col">Credit (₹)</th>
                  <th className="amount-col">Balance (₹)</th>
                </tr>
              </thead>
              <tbody>
                {trialBalance.map((row, index) => (
                  <tr key={row.accountNumber || index}>
                    <td><strong>{row.accountNumber}</strong></td>
                    <td>{getAccountName(row.accountNumber)}</td>
                    <td className="amount-right">
                      {row.debit > 0 ? `₹${formatCurrency(row.debit)}` : '-'}
                    </td>
                    <td className="amount-right">
                      {row.credit > 0 ? `₹${formatCurrency(row.credit)}` : '-'}
                    </td>
                    <td className={`amount-right ${row.balanceType === 'debit' ? 'balance-debit' : 'balance-credit'}`}>
                      ₹{formatCurrency(row.balance)} {row.balanceType === 'debit' ? 'Dr' : 'Cr'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="table-total">
                  <td colSpan="2"><strong>GRAND TOTAL</strong></td>
                  <td className="amount-right"><strong>₹{formatCurrency(grandTotalDebit)}</strong></td>
                  <td className="amount-right"><strong>₹{formatCurrency(grandTotalCredit)}</strong></td>
                  <td className="amount-right">
                    {isBalanced ? (
                      <strong className="balanced-text">✓ Balanced</strong>
                    ) : (
                      <strong className="unbalanced-text">Difference: ₹{formatCurrency(difference)}</strong>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {!isBalanced && (
            <div className="warning-box">
              <strong>⚠️ Trial balance does not match!</strong>
              <p>Total Debits: ₹{formatCurrency(grandTotalDebit)}</p>
              <p>Total Credits: ₹{formatCurrency(grandTotalCredit)}</p>
              <p>Difference: ₹{formatCurrency(difference)}</p>
              <div className="warning-suggestion">
                <p>Possible issues:</p>
                <ul>
                  <li>Missing journal entries</li>
                  <li>Incorrect posting amounts</li>
                  <li>Unbalanced journal entries</li>
                  <li>Opening balance errors</li>
                </ul>
              </div>
            </div>
          )}

          {isBalanced && (
            <div className="success-box">
              ✓ Trial Balance is balanced for {getPeriodDisplay()}
            </div>
          )}
        </div>
      )}

      {!loading && trialBalance.length === 0 && !error && (
        <div className="card full-width">
          <p className="empty-text">No trial balance data available for {getPeriodDisplay()}</p>
        </div>
      )}
    </div>
  );
};

export default TrialBalance;