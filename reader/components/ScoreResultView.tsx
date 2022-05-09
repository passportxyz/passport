// --- React Methods
import React from 'react'

import { DID, Passport, Stamp, VerifiableCredential } from '@dpopp/types'

import { usePublicRecord } from '@self.id/react'
import { useEffect } from 'react'

export type ModelTypes = {
  definitions: {
    Passport: 'kjzl6cwe1jw14b5pv8zucigpz0sc2lh9z5l0ztdrvqw5y1xt2tvz8cjt34bkub9'
    VerifiableCredential: 'kjzl6cwe1jw147bsnnxvupgywgr0tyi7tesgle7e4427hw2dn8sp9dnsltvey1n'
  }
  schemas: {
    Passport: 'ceramic://k3y52l7qbv1frygm3lu9o9qra3nid11t6vuj0mas2m1mmlywh0fop5tgrxf060000'
    VerifiableCredential: 'ceramic://k3y52l7qbv1frxunk7h39a05iup0s5sheycsgi8ozxme1s3tl37modhalv38d05q8'
  }
  tiles: {}
}

export type ScoreResultViewProps = {
  did: string
}

export const ScoreResultView = ({ did }: ScoreResultViewProps): JSX.Element => {
  const record = usePublicRecord<ModelTypes>('Passport', did)

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
          {((record.content as Passport)?.stamps || []).length > 0
            ? 'GOOD'
            : 'BAD'}
        </p>
      )}
    </div>
  )
}
