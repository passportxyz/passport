import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'

import { useState } from 'react'
import { ScoreResultView } from '../components/ScoreResultView'

const Home: NextPage = () => {
  const [did, setDid] = useState<string>('')
  const [didInput, setDidInput] = useState<string>('')

  const scorePassport = () => {
    setDid(didInput)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Head>
        <title>Passport Reader</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
        <div className="container mx-auto flex px-5 py-24">
          {did && <ScoreResultView did={did} />}
          <div className="relative z-10 mt-10 flex w-full flex-col rounded-lg bg-white p-8 shadow-md md:ml-auto md:mt-0 md:w-1/2 lg:w-1/3">
            <div className="relative mb-4">
              <input
                type="did"
                id="did"
                name="did"
                placeholder="DID"
                onChange={(e) => setDidInput(e.target.value)}
                className="w-full rounded border border-gray-300 bg-white py-1 px-3 text-base leading-8 text-gray-700 outline-none transition-colors duration-200 ease-in-out focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <button
              onClick={scorePassport}
              className="rounded border-0 bg-indigo-500 py-2 px-6 text-lg text-white hover:bg-indigo-600 focus:outline-none"
            >
              Score Passport
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home
