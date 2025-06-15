import React, { useState, useEffect } from 'react';
import { Wallet, Send, History, Key, Coins, ArrowRight, Plus, Trash2, Download, RefreshCw } from 'lucide-react';
import * as bitcoin from 'bitcoinjs-lib';
import { ec as EC } from 'elliptic';
import axios from 'axios';
import { Buffer } from 'buffer';

const ec = new EC('secp256k1');

interface Transaction {
  id: number;
  amount: number;
  recipient: string;
  timestamp: string;
  coinType: string;
  txid: string;
  confirmed: boolean;
  type?: string;
}

interface SendItem {
  recipient: string;
  amount: string;
  coinType: string;
}

interface UnconfirmedTx {
  txid: string;
  amount: number;
  fee: number;
}

interface Utxo {
  txid: string;
  vout: number;
  amount: number;
  confirmations: number;
}

const COIN_TYPES = ['BTC', 'ETH', 'USDT', 'LTC', 'WBTC'];

function App() {
  const [activeWallet, setActiveWallet] = useState<any>(null);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sendItems, setSendItems] = useState<SendItem[]>([{ recipient: '', amount: '', coinType: 'BTC' }]);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [unconfirmedTx, setUnconfirmedTx] = useState<UnconfirmedTx | null>(null);
  const [utxos, setUtxos] = useState<Utxo[]>([]);

  const recoverWallet = () => {
    try {
      let keyPair;
      if (recoveryKey.startsWith('5') || recoveryKey.startsWith('K') || recoveryKey.startsWith('L')) {
        // WIF format
        keyPair = bitcoin.ECPair.fromWIF(recoveryKey, bitcoin.networks.bitcoin);
      } else {
        // Hex format
        const privateKey = Buffer.from(recoveryKey, 'hex');
        keyPair = ec.keyFromPrivate(privateKey);
      }
      
      const publicKey = keyPair.getPublic().encode('hex');
      const address = bitcoin.payments.p2pkh({ pubkey: Buffer.from(publicKey, 'hex') }).address;

      setActiveWallet({ address, privateKey: recoveryKey, publicKey });
      updateBalances(address);
      fetchUtxos(address);
      fetchTransactionHistory(address);
    } catch (error) {
      console.error('Error recovering wallet:', error);
      alert('Invalid recovery key. Please try again.');
    }
  };

  const updateBalances = async (address: string) => {
    try {
      const res = await axios.get(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`);
      setBalances({ BTC: res.data.balance / 1e8 });
    } catch (err) {
      console.error('Error fetching balances:', err);
    }
  };

  const fetchUtxos = async (address: string) => {
    try {
      const res = await axios.get(`https://blockchain.info/unspent?active=${address}`);
      const uts = res.data.unspent_outputs.map((u: any) => ({
        txid: u.tx_hash_big_endian,
        vout: u.tx_output_n,
        amount: u.value,
        confirmations: u.confirmations,
      }));
      setUtxos(uts);
    } catch (err) {
      console.error('Error fetching UTXOs:', err);
      setUtxos([]);
    }
  };

  const fetchTransactionHistory = async (address: string) => {
    try {
      const res = await axios.get(`https://api.blockcypher.com/v1/btc/main/addrs/${address}`);
      const hist: Transaction[] = (res.data.txrefs || []).map((tx: any, idx: number) => ({
        id: idx,
        amount: tx.value / 1e8,
        recipient: tx.addresses?.[0] || address,
        timestamp: new Date(tx.confirmed || Date.now()).toLocaleString(),
        coinType: 'BTC',
        txid: tx.tx_hash,
        confirmed: tx.confirmations > 0,
        type: 'transfer',
      }));
      setTransactions(hist);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const addSendItem = () =>
    setSendItems([...sendItems, { recipient: '', amount: '', coinType: 'BTC' }]);

  const removeSendItem = (index: number) =>
    setSendItems(sendItems.filter((_, i) => i !== index));

  const updateSendItem = (index: number, field: keyof SendItem, value: string) =>
    setSendItems(
      sendItems.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );

  const sendCoins = () => {
    const newTxs: Transaction[] = sendItems.map((item, idx) => ({
      id: transactions.length + idx + 1,
      amount: parseFloat(item.amount),
      recipient: item.recipient,
      timestamp: new Date().toLocaleString(),
      coinType: item.coinType,
      txid: Math.random().toString(36).substring(2),
      confirmed: false,
      type: 'transfer',
    }));
    setTransactions([...transactions, ...newTxs]);
    setSendItems([{ recipient: '', amount: '', coinType: 'BTC' }]);
  };

  const checkUnconfirmedTransactions = async () => {
    if (!activeWallet) return;
    try {
      const res = await axios.get(
        `https://api.blockcypher.com/v1/btc/main/addrs/${activeWallet.address}`,
      );
      const utx = res.data.unconfirmed_txrefs?.[0];
      if (utx) {
        setUnconfirmedTx({
          txid: utx.tx_hash,
          amount: utx.value / 1e8,
          fee: utx.fees || 0,
        });
      } else {
        setUnconfirmedTx(null);
      }
    } catch (err) {
      console.error('Error checking unconfirmed transactions:', err);
    }
  };

  const handleRBF = () => {
    alert('RBF initiated (placeholder)');
  };

  const handleCPFP = () => {
    alert('CPFP initiated (placeholder)');
  };

  const downloadTransactionData = () => {
    if (!unconfirmedTx) return;
    const data = JSON.stringify(unconfirmedTx, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transaction.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (activeWallet) {
      checkUnconfirmedTransactions();
      fetchUtxos(activeWallet.address);
      fetchTransactionHistory(activeWallet.address);
    }
  }, [activeWallet]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg border border-cyan-500">
          <h1 className="text-3xl font-bold mb-6 text-center text-cyan-400">PyGUI Wallet</h1>
          
          {!activeWallet ? (
            <div className="mb-6">
              <input
                type="text"
                value={recoveryKey}
                onChange={(e) => setRecoveryKey(e.target.value)}
                placeholder="Enter recovery key (WIF or hex private key)"
                className="w-full mb-2 p-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
              <button
                onClick={recoverWallet}
                className="w-full bg-cyan-600 text-white py-2 px-4 rounded hover:bg-cyan-700 transition duration-200 flex items-center justify-center"
              >
                <Key className="mr-2" size={20} />
                Recover Wallet
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-2 flex items-center">
                  <Wallet className="mr-2" size={24} />
                  Wallet Address
                </h2>
                <p className="break-all">{activeWallet.address}</p>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2 flex items-center">
                  <Coins className="mr-2" size={24} />
                  Balances
                </h2>
                {Object.entries(balances).map(([coin, balance]) => (
                  <div key={coin} className="flex justify-between items-center mb-2 bg-gray-700 p-2 rounded">
                    <span>{coin}</span>
                    <span>{balance}</span>
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Send className="mr-2" size={24} />
                  Send Coins
                </h2>
                {sendItems.map((item, index) => (
                  <div key={index} className="mb-4 flex items-center space-x-2">
                    <input
                      type="text"
                      value={item.recipient}
                      onChange={(e) => updateSendItem(index, 'recipient', e.target.value)}
                      placeholder="Recipient address"
                      className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => updateSendItem(index, 'amount', e.target.value)}
                      placeholder="Amount"
                      className="w-24 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                    <select
                      value={item.coinType}
                      onChange={(e) => updateSendItem(index, 'coinType', e.target.value)}
                      className="p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      {COIN_TYPES.map((coin) => (
                        <option key={coin} value={coin}>{coin}</option>
                      ))}
                    </select>
                    {index === sendItems.length - 1 ? (
                      <button
                        onClick={addSendItem}
                        className="bg-green-600 text-white p-2 rounded hover:bg-green-700 transition duration-200"
                      >
                        <Plus size={20} />
                      </button>
                    ) : (
                      <button
                        onClick={() => removeSendItem(index)}
                        className="bg-red-600 text-white p-2 rounded hover:bg-red-700 transition duration-200"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={sendCoins}
                  className="w-full bg-cyan-600 text-white py-2 px-4 rounded hover:bg-cyan-700 transition duration-200 flex items-center justify-center mt-4"
                >
                  <ArrowRight className="mr-2" size={20} />
                  Send All
                </button>
              </div>
              
              {unconfirmedTx && (
                <div className="mb-6 bg-gray-700 p-4 rounded-lg border border-yellow-500">
                  <h2 className="text-2xl font-semibold mb-3 flex items-center text-yellow-400">
                    <RefreshCw className="mr-2" size={24} />
                    Unconfirmed Transaction
                  </h2>
                  <p className="mb-2">TXID: {unconfirmedTx.txid}</p>
                  <p className="mb-2">Amount: {unconfirmedTx.amount} BTC</p>
                  <p className="mb-4">Current Fee: {unconfirmedTx.fee} satoshis/byte</p>
                  <div className="flex justify-between">
                    <button
                      onClick={handleRBF}
                      className="bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 transition duration-200"
                    >
                      Replace-By-Fee (RBF)
                    </button>
                    <button
                      onClick={handleCPFP}
                      className="bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 transition duration-200"
                    >
                      Child-Pays-For-Parent (CPFP)
                    </button>
                    <button
                      onClick={downloadTransactionData}
                      className="bg-cyan-600 text-white py-2 px-4 rounded hover:bg-cyan-700 transition duration-200 flex items-center"
                    >
                      <Download size={20} className="mr-2" />
                      Download TX Data
                    </button>
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-xl font-semibold mb-2 flex items-center">
                  <History className="mr-2" size={24} />
                  Transaction History
                </h2>
                <ul className="space-y-2">
                  {transactions.map((tx) => (
                    <li key={tx.id} className="bg-gray-700 p-2 rounded">
                      <div className="flex justify-between">
                        <span>{tx.recipient}</span>
                        <span className="font-semibold">{tx.amount} {tx.coinType}</span>
                      </div>
                      <div className="text-sm text-gray-400">{tx.timestamp}</div>
                      <div className="text-sm">
                        <span className={tx.confirmed ? "text-green-400" : "text-yellow-400"}>
                          {tx.confirmed ? "Confirmed" : "Unconfirmed"}
                        </span>
                        {" - "}
                    <span className="text-blue-400">{tx.txid}</span>
                      {tx.type && (
                        <span className="ml-2 text-purple-400">({tx.type})</span>
                      )}
                  </div>
                </li>
              ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;