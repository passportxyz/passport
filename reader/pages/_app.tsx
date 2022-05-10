import '../styles/globals.css'
import type { AppProps } from 'next/app'

import type { ModelTypesToAliases } from '@glazed/types'
import type { ModelTypes } from '../components/ScoreResultView'

// publish-model.json
const aliasesJson = {
  definitions: {
    Passport: 'kjzl6cwe1jw14b5pv8zucigpz0sc2lh9z5l0ztdrvqw5y1xt2tvz8cjt34bkub9',
    VerifiableCredential:
      'kjzl6cwe1jw147bsnnxvupgywgr0tyi7tesgle7e4427hw2dn8sp9dnsltvey1n',
  },
  schemas: {
    Passport:
      'ceramic://k3y52l7qbv1frygm3lu9o9qra3nid11t6vuj0mas2m1mmlywh0fop5tgrxf060000',
    VerifiableCredential:
      'ceramic://k3y52l7qbv1frxunk7h39a05iup0s5sheycsgi8ozxme1s3tl37modhalv38d05q8',
  },
  tiles: {},
}

const aliases: ModelTypesToAliases<ModelTypes> = aliasesJson

// --- Ceramic Tools
import { Provider } from '@self.id/framework'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider client={{ ceramic: 'testnet-clay', aliases }}>
      <Component {...pageProps} />
    </Provider>
  )
}

export default MyApp
