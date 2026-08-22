import { createPublicClient, createWalletClient, custom, formatEther, http, parseEther, type WalletClient } from 'viem'
import { isAddress, getAddress } from 'viem'
import { MONAD_TESTNET } from './format'

export const MONAD_TESTNET_CHAIN = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } },
  blockExplorers: { default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' } },
} as const

type EthereumProvider = { request(args: { method: string; params?: unknown[] }): Promise<unknown>; on?: (event: string, handler: (...args: unknown[]) => void) => void }
declare global {
  interface Window { ethereum?: EthereumProvider }
}

let discoveredProvider: EthereumProvider | undefined

export function getProvider() {
  if (typeof window === 'undefined') return undefined
  if (window.ethereum) return window.ethereum
  return discoveredProvider
}

export async function discoverInjectedProvider() {
  if (typeof window === 'undefined') return undefined
  if (window.ethereum) return window.ethereum
  return new Promise<EthereumProvider | undefined>((resolve) => {
    let settled = false
    const finish = (provider?: EthereumProvider) => {
      if (settled) return
      settled = true
      discoveredProvider = provider
      resolve(provider)
    }
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ provider?: EthereumProvider }>).detail
      if (detail?.provider) finish(detail.provider)
    }
    window.addEventListener('eip6963:announceProvider', handler, { once: true })
    window.dispatchEvent(new Event('eip6963:requestProvider'))
    window.setTimeout(() => {
      window.removeEventListener('eip6963:announceProvider', handler)
      finish()
    }, 700)
  })
}
export function validateRecipient(value: string) { return isAddress(value) }
export async function createInjectedWallet(): Promise<WalletClient> {
  const provider = getProvider() || await discoverInjectedProvider()
  if (!provider) throw new Error('No injected wallet detected. Open the deployed app in a browser with Rabby or MetaMask enabled, then try again.')
  return createWalletClient({ chain: MONAD_TESTNET_CHAIN, transport: custom(provider) })
}
export async function connectInjectedWallet() {
  const client = await createInjectedWallet()
  const [address] = await client.requestAddresses()
  const chainId = await client.getChainId()
  if (chainId !== MONAD_TESTNET_CHAIN.id) {
    try { await client.switchChain({ id: MONAD_TESTNET_CHAIN.id }) } catch {
      await client.addChain({ chain: MONAD_TESTNET_CHAIN })
      await client.switchChain({ id: MONAD_TESTNET_CHAIN.id })
    }
  }
  const publicClient = createPublicClient({ chain: MONAD_TESTNET_CHAIN, transport: http() })
  const balance = await publicClient.getBalance({ address })
  return { client, address, balance: formatEther(balance) }
}
export async function sendEscrowPayment(client: WalletClient, account: `0x${string}`, recipient: string, amount: string) {
  if (!validateRecipient(recipient)) throw new Error('Enter a valid Monad Testnet recipient address.')
  const to = getAddress(recipient)
  const value = parseEther(amount)
  const publicClient = createPublicClient({ chain: MONAD_TESTNET_CHAIN, transport: http() })

  // Estimate gas through Monad's public RPC before opening Rabby. Supplying an
  // explicit gas limit avoids Rabby waiting on its unsupported simulation RPC.
  const gas = await publicClient.estimateGas({ account, to, value })
  const gasPrice = await publicClient.getGasPrice()
  const hash = await client.sendTransaction({
    account,
    to,
    value,
    gas,
    gasPrice,
    chain: MONAD_TESTNET_CHAIN,
  })
  return { hash, receipt: await publicClient.waitForTransactionReceipt({ hash }) }
}
export const testnetExplorer = MONAD_TESTNET.explorer.replace('/tx/', '')
