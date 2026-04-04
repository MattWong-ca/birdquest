/**
 * One-time setup: creates HTS Badge NFT collection on Hedera Testnet.
 * Run once: npx tsx scripts/setup-badge-token.ts
 * Copy the printed ID into your .env.local
 */

import {
  AccountId,
  Client,
  PrivateKey,
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenSupplyType,
  TokenType,
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
  const operatorKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!);

  const badgeTx = await new TokenCreateTransaction()
    .setTokenName('BirdQuest Badges')
    .setTokenSymbol('BQBADGE')
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Infinite)
    .setSupplyKey(operatorKey)
    .setTreasuryAccountId(operatorId)
    .execute(client);

  const receipt = await badgeTx.getReceipt(client);
  const badgeTokenId = receipt.tokenId!;
  console.log('HEDERA_BADGE_TOKEN_ID=' + badgeTokenId.toString());

  // Mint First Trip NFT to operator's own account (treasury = operator)
  const firstTripMetadata = JSON.stringify({
    name: 'First Trip',
    image: 'https://i.imgur.com/Cv1HgA5.png',
  });

  const mintTx = await new TokenMintTransaction()
    .setTokenId(badgeTokenId)
    .setMetadata([Buffer.from(firstTripMetadata)])
    .execute(client);
  const mintReceipt = await mintTx.getReceipt(client);
  const serial = Number(mintReceipt.serials[0]);
  console.log('First Trip NFT minted — serial #' + serial);

  // Transfer to your wallet
  const recipientId = AccountId.fromEvmAddress(0, 0, '0x55b8cd2e22a329426a976f79e0fc2e047345e070');
  const transferTx = await new TransferTransaction()
    .addNftTransfer(badgeTokenId, serial, operatorId, recipientId)
    .execute(client);
  await transferTx.getReceipt(client);
  console.log('First Trip NFT transferred to 0x55b8cd2e22a329426a976f79e0fc2e047345e070');

  console.log('\nAdd the HEDERA_BADGE_TOKEN_ID line above to your .env.local and Vercel env vars.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
