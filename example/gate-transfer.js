const { Client, Account } = require('@mutadev/muta-sdk');

// muta client - to compose transaction
const chainClient = new Client({ endpoint: 'http://localhost:8000/graphql' });
// explorer client - to send transaction
const explorerClient = new Client({ endpoint: 'http://localhost:4040/chain' });

async function main() {
  const account = new Account();

  const tx = await chainClient.composeTransaction({
    serviceName: 'asset',
    method: 'transfer',
    payload: {
      asset_id:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      to: 'muta1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqggfy0d',
      value: 1,
      memo: 'hello',
    },
    sender: account.address,
    // or if I can provide the timeout without composing by muta-sdk
    // timeout: '0x1234'
  });

  const signedTx = account.signTransaction(tx);

  const txHash = await explorerClient.sendTransaction(signedTx);
  console.log(`txHash: [${txHash}]`);
}

main();
