# PyGUI Wallet

PyGUI Wallet is a multi-cryptocurrency wallet with a dark, futuristic interface built using React, TypeScript, and Tailwind CSS. It is designed as a third-party offline ledger recovery tool. The application uses BTCRecover to search local files for wallet credentials, PyWallet to extract keys, and CryptoFuzz to recover seeds from wallet DAT files. All recovery operations are performed locally without modifying existing wallet data.

## Features

- Support for multiple cryptocurrencies (BTC, ETH, USDT, LTC, WBTC)
- Offline wallet recovery using BTCRecover, PyWallet, CryptoFuzz, and DeepTools-based methods
- Send transactions to multiple recipients
- Transaction history
- Dark mode interface

## Installation Instructions

Follow these steps to set up and run the PyGUI Wallet on your local machine:

1. **Clone the repository**

   ```
   git clone https://github.com/yourusername/pygui-wallet.git
   cd pygui-wallet
   ```

2. **Install Node.js**

   Make sure you have Node.js installed (version 14 or higher). You can download it from [nodejs.org](https://nodejs.org/).

3. **Install dependencies**

   Run the following command to install all required dependencies:

   ```
   npm install
   ```

4. **Set up environment variables**

   Create a `.env` file in the root directory and add any necessary environment variables. For example:

   ```
   VITE_API_URL=https://api.example.com
   ```

5. **Start the development server**

   Run the following command to start the development server:

   ```
   npm run dev
   ```

   This will start the application on `http://localhost:5173` (or another port if 5173 is in use).

6. **Build for production**

   When you're ready to deploy the application, create a production build:

   ```
   npm run build
   ```

   This will generate optimized files in the `dist` directory.

7. **Run the app offline**

   You can open the generated `dist/index.html` directly in your browser to use
   the wallet without starting a development server. The interface will load
   from your local files, though any features that require network access (such
   as fetching balances) will still need an internet connection.

## Usage

1. Open the application in your web browser.
2. Enter your recovery key (WIF or hex private key) to recover your wallet.
3. Once recovered, you can view your balances for different cryptocurrencies.
4. To send coins, enter the recipient's address, amount, and select the coin type.
5. Click "Add Transaction" to send to multiple recipients in one go.
6. Click "Send All" to process the transactions.
* To view key variants from a mnemonic seed, download the open-source BTC Seed Tool (such as Ian Coleman's BIP39 tool) and open its HTML file locally.
7. View your transaction history at the bottom of the page.

## Security Considerations

- Always keep your recovery key safe and never share it with anyone.
- This wallet is for educational purposes only. For handling real cryptocurrencies, use well-established and audited wallet solutions.
- The application doesn't store any private keys or sensitive information on the server. All operations are performed client-side.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).