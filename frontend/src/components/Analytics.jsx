// defi-easysave/frontend/src/components/Analytics.jsx
import React, { useState, useEffect } from 'react';
import { ethers, BrowserProvider } from 'ethers';
import SavingsPoolABI from '../abis/SavingsPool.json';
import MockV3AggregatorABI from '../abis/MockV3Aggregator.json';

const Analytics = ({ account }) => {
  const [tokenRates, setTokenRates] = useState({});
  const [userHistory, setUserHistory] = useState([]);
  const [poolBalances, setPoolBalances] = useState([]);
  const [usdcEthPrice, setUsdcEthPrice] = useState('0');
  const [error, setError] = useState(null);

  const savingsPoolAddress = process.env.REACT_APP_SAVINGS_POOL_ADDRESS;
  const mockAggregatorAddress = process.env.REACT_APP_MOCK_AGGREGATOR_ADDRESS;
  const tokens = [
    { name: 'mUSDC', address: process.env.REACT_APP_MOCK_USDC_ADDRESS },
    { name: 'mDAI', address: process.env.REACT_APP_MOCK_DAI_ADDRESS },
    { name: 'mUSDT', address: process.env.REACT_APP_MOCK_USDT_ADDRESS },
  ];

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        if (!window.ethereum) {
          throw new Error('MetaMask not detected');
        }
        const provider = new BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        if (network.chainId !== 11155111n) {
          throw new Error('Please switch to Sepolia network');
        }

        if (!account || !savingsPoolAddress || !mockAggregatorAddress) {
          throw new Error(
            `Missing parameters: account=${account}, savingsPoolAddress=${savingsPoolAddress}, mockAggregatorAddress=${mockAggregatorAddress}`
          );
        }

        console.log('SavingsPool Address:', savingsPoolAddress);
        console.log('MockAggregator Address:', mockAggregatorAddress);
        console.log('Tokens:', tokens);
        console.log('Account:', account);

        const savingsPool = new ethers.Contract(savingsPoolAddress, SavingsPoolABI.abi, provider);
        const aggregator = new ethers.Contract(mockAggregatorAddress, MockV3AggregatorABI.abi, provider);

        // Fetch token rates (APY)
        const rates = {};
        for (const token of tokens) {
          console.log(`Fetching rate for ${token.name}: ${token.address}`);
          const rate = await savingsPool.tokenRates(token.address);
          rates[token.name] = ethers.formatUnits(rate, 0);
          console.log(`${token.name} rate:`, rates[token.name]);
        }
        setTokenRates(rates);

        // Fetch USDC/ETH price
        const [, price,,,] = await aggregator.latestRoundData();
        const formattedPrice = ethers.formatUnits(price, 8);
        console.log('USDC/ETH price:', formattedPrice);
        setUsdcEthPrice(formattedPrice);

        // Fetch user transaction history
        console.log('Fetching user history for:', account);
        const history = await savingsPool.getUserHistory(account);
        console.log('Raw history:', history);
        setUserHistory(
          history.map((tx) => ({
            action: tx.action,
            amount: ethers.formatEther(tx.amount),
            timestamp: new Date(Number(tx.timestamp) * 1000).toLocaleString(),
            token: tokens.find((t) => t.address.toLowerCase() === tx.token.toLowerCase())?.name || 'Unknown',
          }))
        );

        // Fetch social pool balances
        console.log('Fetching pool count');
        const poolCount = await savingsPool.poolCount();
        console.log('Pool count:', poolCount.toString());
        const pools = [];
        for (let i = 1; i <= Number(poolCount); i++) {
          console.log(`Fetching pool ${i}`);
          const balance = await savingsPool.getPoolBalance(i);
          const pool = await savingsPool.pools(i);
          pools.push({
            id: i,
            balance: ethers.formatEther(balance),
            target: ethers.formatEther(pool.targetAmount),
            token: tokens.find((t) => t.address.toLowerCase() === pool.token.toLowerCase())?.name || 'Unknown',
          });
          console.log(`Pool ${i}:`, pools[pools.length - 1]);
        }
        setPoolBalances(pools);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setError(error.message);
      }
    };

    if (account && savingsPoolAddress && mockAggregatorAddress) {
      fetchAnalytics();
    } else {
      console.error('Missing required parameters:', { account, savingsPoolAddress, mockAggregatorAddress });
      setError('Missing required parameters');
    }
  }, [account, savingsPoolAddress, mockAggregatorAddress]);

  if (error) {
    return <div className="p-6 bg-gray-900 text-white rounded-lg shadow-lg">Error: {error}</div>;
  }

  if (!account) {
    return (
      <div className="p-6 bg-gray-900 text-white rounded-lg shadow-lg">
        Please connect your MetaMask wallet
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Analytics Dashboard</h2>

      {/* Token Rates */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold">Token APY Rates</h3>
        {Object.keys(tokenRates).length === 0 ? (
          <p>No rates available</p>
        ) : (
          <ul className="list-disc pl-5">
            {Object.entries(tokenRates).map(([token, rate]) => (
              <li key={token}>
                {token}: {rate}% APY
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* USDC/ETH Price */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold">USDC/ETH Price</h3>
        <p>{usdcEthPrice} ETH per USDC</p>
      </div>

      {/* Transaction History */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold">Transaction History</h3>
        {userHistory.length === 0 ? (
          <p>No transactions available</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="p-2">Action</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Token</th>
                <th className="p-2">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {userHistory.map((tx, index) => (
                <tr key={index}>
                  <td className="p-2">{tx.action}</td>
                  <td className="p-2">{tx.amount}</td>
                  <td className="p-2">{tx.token}</td>
                  <td className="p-2">{tx.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Social Pools */}
      <div>
        <h3 className="text-xl font-semibold">Social Pools</h3>
        {poolBalances.length === 0 ? (
          <p>No pools available</p>
        ) : (
          <ul className="list-disc pl-5">
            {poolBalances.map((pool) => (
              <li key={pool.id}>
                Pool {pool.id} ({pool.token}): {pool.balance}/{pool.target} deposited
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Analytics;