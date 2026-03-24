import Conf from 'conf'

interface SipHeronConfig {
  apiKey?: string
  network: 'devnet' | 'mainnet'
  defaultFormat: 'human' | 'json' | 'quiet'
}

const store = new Conf<SipHeronConfig>({
  projectName: 'sipheron',
  defaults: {
    network: 'devnet',
    defaultFormat: 'human'
  }
})

export const config = {
  getApiKey: (): string | undefined => process.env.SIPHERON_API_KEY || store.get('apiKey'),
  setApiKey: (key: string): void => store.set('apiKey', key),
  clearApiKey: (): void => store.delete('apiKey'),
  getNetwork: () => store.get('network'),
  setNetwork: (n: 'devnet' | 'mainnet') => store.set('network', n),
  getFormat: () => store.get('defaultFormat'),
  isAuthenticated: (): boolean => !!(process.env.SIPHERON_API_KEY || store.get('apiKey'))
}
