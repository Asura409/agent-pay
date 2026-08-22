export const MONAD_TESTNET = { name: 'Monad Testnet', chainId: '10143', explorer: 'https://testnet.monadexplorer.com/tx/' }
export function explorerUrl(hash: string) { return `${MONAD_TESTNET.explorer}${hash}` }
export function shortAddress(address: string) { return address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address }
