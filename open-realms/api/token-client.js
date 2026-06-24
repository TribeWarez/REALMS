import fetch from 'node-fetch';

const VALIDATOR_URL = process.env.VALIDATOR_URL || '';

// Supported token types matching pot-o-validator's TokenType enum
const TOKEN_TYPES = ['PTtC', 'NMTC', 'STOMP', 'AUM', 'AI3'];

let tokenCache = {
  balances: {},
  last_fetched: null
};

let fetchInterval = null;

// --- Balance queries ---

async function fetchBalance(address, tokenType) {
  if (!VALIDATOR_URL || !tokenType) return null;
  try {
    const resp = await fetch(
      `${VALIDATOR_URL}/token/balance/${encodeURIComponent(address)}/${encodeURIComponent(tokenType)}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

async function fetchAllBalances(address) {
  if (!VALIDATOR_URL || !address) return {};

  const results = {};
  for (const token of TOKEN_TYPES) {
    const balance = await fetchBalance(address, token);
    if (balance !== null) {
      results[token] = balance;
    }
  }

  tokenCache = {
    balances: results,
    last_fetched: new Date().toISOString()
  };

  return results;
}

async function fetchTxHistory(address) {
  if (!VALIDATOR_URL || !address) return [];
  try {
    const resp = await fetch(
      `${VALIDATOR_URL}/token/tx/${encodeURIComponent(address)}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.transactions || data || [];
  } catch {
    return [];
  }
}

// --- Public API ---

export function getTokenBalances() {
  return tokenCache;
}

export function getSupportedTokens() {
  return TOKEN_TYPES;
}

// --- Express routes ---

let currentAddress = null;

export function setTokenAddress(address) {
  currentAddress = address;
}

export function createTokenRouter() {
  return {
    getBalances: async (req, res) => {
      if (!VALIDATOR_URL || !currentAddress) {
        return res.json({ connected: false, balances: {}, supported_tokens: TOKEN_TYPES });
      }
      const balances = await fetchAllBalances(currentAddress);
      res.json({ connected: true, balances, supported_tokens: TOKEN_TYPES, last_fetched: tokenCache.last_fetched });
    },

    getBalance: async (req, res) => {
      if (!VALIDATOR_URL || !currentAddress) {
        return res.status(503).json({ error: 'no validator connected' });
      }
      const { tokenType } = req.params;
      if (!TOKEN_TYPES.includes(tokenType)) {
        return res.status(400).json({ error: `unsupported token: ${tokenType}. Supported: ${TOKEN_TYPES.join(', ')}` });
      }
      const balance = await fetchBalance(currentAddress, tokenType);
      res.json({ token: tokenType, balance });
    },

    getTransactions: async (req, res) => {
      if (!VALIDATOR_URL || !currentAddress) {
        return res.status(503).json({ error: 'no validator connected' });
      }
      const txs = await fetchTxHistory(currentAddress);
      res.json({ transactions: txs });
    }
  };
}

// --- Lifecycle ---

export function startTokenClient(address) {
  currentAddress = address;
  if (!VALIDATOR_URL) {
    console.log('[token] no VALIDATOR_URL set, skipping');
    return;
  }

  console.log(`[token] monitoring balances for ${address}`);

  // Initial fetch
  setTimeout(() => fetchAllBalances(address), 5000);

  // Periodic refresh
  fetchInterval = setInterval(() => fetchAllBalances(address), 120000);
  fetchInterval.unref();
}
