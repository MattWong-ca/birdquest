/**
 * One-off: mint First Trip NFT from existing badge token and send to your wallet.
 * Run: npx tsx scripts/mint-first-trip.ts
 */

import {
  AccountId,
  Client,
  PrivateKey,
  TokenId,
  TokenMintTransaction,
  TransferTransaction,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = Client.forTestnet().setOperator(
  AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!),
  PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!)
);

async function main() {
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const badgeTokenId = TokenId.fromString(process.env.HEDERA_BADGE_TOKEN_ID!);

  const metadata = JSON.stringify({
    name: 'First Trip',
    image: 'https://i.imgur.com/Cv1HgA5.png',
  });

  const mintTx = await new TokenMintTransaction()
    .setTokenId(badgeTokenId)
    .setMetadata([Buffer.from(metadata)])
    .execute(client);
  const mintReceipt = await mintTx.getReceipt(client);
  const serial = Number(mintReceipt.serials[0]);
  console.log('Minted serial #' + serial);

  const recipientId = AccountId.fromEvmAddress(0, 0, '0x55b8cd2e22a329426a976f79e0fc2e047345e070');
  const transferTx = await new TransferTransaction()
    .addNftTransfer(badgeTokenId, serial, operatorId, recipientId)
    .execute(client);
  await transferTx.getReceipt(client);
  console.log('Transferred to 0x55b8cd2e22a329426a976f79e0fc2e047345e070');
}

main().catch(e => { console.error(e); process.exit(1); });
