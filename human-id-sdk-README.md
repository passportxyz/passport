# @holonym-foundation/human-id-sdk

A TypeScript SDK for integrating Human ID private verification flows with SBTs into your app.

## Installation

```bash
npm install @holonym-foundation/human-id-sdk
```

## Quick Start

```typescript
import { initHumanID } from '@holonym-foundation/human-id-sdk'

// Initialize the SDK
const humanID = initHumanID()

// Request a KYC SBT
const result = await humanID.requestSBT('kyc')
console.log('SBT recipient:', result?.recipient)
```

## Features

- Request KYC and Phone SBTs
- Query SBT ownership

## API Reference

### Initialize the provider

```typescript
import { initHumanID } from '@holonym-foundation/human-id-sdk'

// initHumanID() also sets window.humanID to this provider
const humanID = initHumanID()
```

### Request SBT

The SDK provides two ways to request SBTs:

1. Simple Request. This requires the user to connect their wallet to the Human ID iframe.
```typescript
const result = await humanID.requestSBT('kyc')
```

2. Advanced Request. This allows Passport to handle all wallet interactions on behalf of the Human ID iframe.
```typescript
const msg = humanID.getKeygenMessage()
const signature = await signMessageAsync({ message: msg })

const result = await humanID.privateRequestSBT('phone', {
  signature,
  address: userAddress,
  paymentCallback: async (tx) => {
    // Handle the transaction
    await switchChainAsync({ chainId: Number(tx.chainId) })
    const txHash = await sendTransactionAsync({
      to: tx.to,
      value: BigInt(tx.value ?? '0'),
      data: tx.data,
    })
    return {
      txHash,
      chainId: Number(tx.chainId)
    }
  }
})
```

### Query SBTs

First, to make SBT queries, you must provide an RPC URL for Optimism.

```typescript
import { setOptimismRpcUrl } from '@holonym-foundation/human-id-sdk'

setOptimismRpcUrl('YOUR_OPTIMISM_RPC_URL')
```

Query functions:

```typescript
import { 
  getPhoneSBTByAddress,
  getKycSBTByAddress,
  uncheckedGetMinimalPhoneSBTByAddress,
  uncheckedGetMinimalKycSBTByAddress 
} from '@holonym-foundation/human-id-sdk'

const phoneSbt = await getPhoneSBTByAddress(address)
const kycSbt = await getKycSBTByAddress(address)

const minimalPhoneSbt = await uncheckedGetMinimalPhoneSBTByAddress(address)
const minimalKycSbt = await uncheckedGetMinimalKycSBTByAddress(address)
```

## Example Usage with React

```typescript
import { useState } from 'react'
import { useAccount, useSignMessage, useSendTransaction, useSwitchChain } from 'wagmi'
import { initHumanID } from '@holonym-foundation/human-id-sdk'

function RequestSbtComponent() {
  const [sbtRecipient, setSbtRecipient] = useState('')
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { sendTransactionAsync } = useSendTransaction()
  const { switchChainAsync } = useSwitchChain()

  const requestSbt = async () => {
    try {
      const humanID = initHumanID()
      const msg = humanID.getKeygenMessage()
      const signature = await signMessageAsync({ message: msg })
      
      const result = await humanID.privateRequestSBT('phone', {
        signature,
        address,
        paymentCallback: async (tx) => {
          await switchChainAsync({ chainId: Number(tx.chainId) })
          const txHash = await sendTransactionAsync({
            to: tx.to,
            value: BigInt(tx.value ?? '0'),
            data: tx.data,
          })
          return {
            txHash,
            chainId: Number(tx.chainId)
          }
        }
      })
      
      setSbtRecipient(result?.recipient ?? '')
    } catch (error) {
      console.error('Error requesting SBT:', error)
    }
  }

  return (
    <div>
      <button onClick={requestSbt}>Request SBT</button>
      <p>SBT recipient: {sbtRecipient}</p>
    </div>
  )
}
```
