import { createClient } from '@dynamic-labs/client';
import { ReactNativeExtension } from '@dynamic-labs/react-native-extension';
import { ViemExtension } from '@dynamic-labs/viem-extension';

export const dynamicClient = createClient({
  environmentId: '0dd39d34-edc4-444d-bea8-0e3d77b62d95',
  appName: 'BirdQuest',
  appLogoUrl: 'https://i.imgur.com/Jj2lifz.png',
})
  .extend(ReactNativeExtension())
  .extend(ViemExtension());
