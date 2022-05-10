// --- React Methods
import React from 'react'

// import { VerifiableCredential } from '@dpopp/types'

import type { ModelTypeAliases } from '@glazed/types'
import { usePublicRecord } from '@self.id/react'
import { useEffect } from 'react'

// copied from @dpopp/types
type VerifiableCredential = {
  '@context': string[]
  type: string[]
  credentialSubject: {
    id: string
    '@context': { [key: string]: string }[]
    root?: string
    address?: string
    challenge?: string
  }
  issuer: string
  issuanceDate: string
  expirationDate: string
  proof: {
    type: string
    proofPurpose: string
    verificationMethod: string
    created: string
    jws: string
  }
}

type CeramicStamp = {
  provider: string
  credential: string
}
type CeramicPassport = {
  issuanceDate: string
  expiryDate: string
  stamps: CeramicStamp[]
}

export type ModelTypes = ModelTypeAliases<
  {
    Passport: CeramicPassport
    VerifiableCredential: VerifiableCredential
  },
  {
    Passport: 'Passport'
    VerifiableCredential: 'VerifiableCredential'
  },
  {}
>

export type ScoreResultViewProps = {
  did: string
}

export const ScoreResultView = ({ did }: ScoreResultViewProps): JSX.Element => {
  const record = usePublicRecord<ModelTypes, 'Passport'>('Passport', did)

  useEffect(() => {
    console.log(record)
  }, [record])

  return (
    <div>
      {record.isLoading ? (
        <div>
          <p>LOADING</p>
        </div>
      ) : (
        <p>
          {((record.content as CeramicPassport)?.stamps || []).length > 0
            ? 'GOOD'
            : 'BAD'}
        </p>
      )}
    </div>
  )
}
