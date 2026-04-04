import { createClient } from '@dynamic-labs/client';
import { ReactNativeExtension } from '@dynamic-labs/react-native-extension';
import { ViemExtension } from '@dynamic-labs/viem-extension';

const hederaTestnet = {
  blockExplorerUrls: ["https://hashscan.io/testnet"],
  chainId: 296,
  chainName: "Hedera Testnet",
  iconUrls: ["https://s3.coinmarketcap.com/static-gravity/image/b15be06c12d2400ba3d8ce285db3c578.png"],
  name: "Hedera Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "HBAR",
    symbol: "HBAR",
    iconUrl: "https://s3.coinmarketcap.com/static-gravity/image/b15be06c12d2400ba3d8ce285db3c578.png",
  },
  networkId: 296,
  rpcUrls: ["https://testnet.hashio.io/api"],
  vanityName: "Hedera Testnet",
};

export const dynamicClient = createClient({
  environmentId: '0dd39d34-edc4-444d-bea8-0e3d77b62d95',
  appName: 'BirdQuest',
  appLogoUrl: 'https://i.imgur.com/Jj2lifz.png',
  evmNetworks: [hederaTestnet],
})
  .extend(ReactNativeExtension({ appOrigin: 'https://birdquest.expo.dev' }))
  .extend(ViemExtension());
