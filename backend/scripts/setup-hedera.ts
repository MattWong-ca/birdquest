/**
 * One-time setup: creates HCS topic + HTS BIRD token on Hedera Testnet.
 * Run once: npx ts-node scripts/setup-hedera.ts
 * Copy the printed IDs into your .env.local
 */

import {
  AccountId,
  Client,
  PrivateKey,
  TokenCreateTransaction,
  TokenSupplyType,
  TokenType,
  TopicCreateTransaction,
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

  // Create HCS topic
  const topicTx = await new TopicCreateTransaction()
    .setTopicMemo('BirdQuest trip logs')
    .execute(client);
  const topicReceipt = await topicTx.getReceipt(client);
  const topicId = topicReceipt.topicId!.toString();
  console.log('HEDERA_TOPIC_ID=' + topicId);

  // Create HTS BIRD fungible token
  const tokenTx = await new TokenCreateTransaction()
    .setTokenName('BirdQuest Token')
    .setTokenSymbol('BIRD')
    .setTokenType(TokenType.FungibleCommon)
    .setDecimals(0)
    .setInitialSupply(100000)
    .setSupplyType(TokenSupplyType.Infinite)
    .setSupplyKey(operatorKey)
    .setTreasuryAccountId(operatorId)
    .execute(client);
  const tokenReceipt = await tokenTx.getReceipt(client);
  const tokenId = tokenReceipt.tokenId!.toString();
  console.log('HEDERA_TOKEN_ID=' + tokenId);

  console.log('\nAdd both lines above to your .env.local');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
