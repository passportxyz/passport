import type { NextPage } from 'next'
import Head from 'next/head'

import React, { useState } from 'react'
import { ScoreResultView } from '../components/ScoreResultView'

const Home: NextPage = () => {
  const [did, setDid] = useState<string>('')
  const [didInput, setDidInput] = useState<string>('')

  const scorePassport = () => {
    setDid(didInput)
  }

  return (
    <div className="container mx-auto flex flex-wrap px-5 py-24 sm:flex-nowrap">
      <Head>
        <title>Passport Reader</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col rounded-lg p-10 sm:mr-10 md:w-1/2 lg:w-1/2">
        <div className="font-miriam-libre text-gray-050 mt-10 font-bold leading-relaxed">
          <p className="text-6xl">
            A Decentralized
            <br />
            Scorer Application
          </p>
        </div>
        <div className="font-libre-franklin mt-10 text-xl">
          Project dPopp is a passport for Web3 citizens - issued through a
          collection of trusted sources that confirm your identity. Designed to
          provide proof through your passport, dPopp verifies your Personhood
          strengthening your sybil resistance. Decentralized on Ceramic Network.
        </div>
        <div className="mb-10 mt-10">
          <input
            type="did"
            id="did"
            name="did"
            placeholder="Enter your dID"
            onChange={(e) => setDidInput(e.target.value)}
            className="w-full rounded border border-gray-300 bg-white py-1 px-3 text-base leading-8 text-gray-700 outline-none transition-colors duration-200 ease-in-out focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <button
            onClick={scorePassport}
            className="mt-4 w-full rounded border-0 bg-indigo-400 py-2 px-6 text-lg text-white hover:bg-indigo-600 focus:outline-none"
          >
            <p className="text-base">Score My Passport</p>
          </button>
        </div>
      </div>
      <div className="mt-8 flex w-full flex-col bg-white md:ml-auto md:mt-0 md:w-1/2 md:py-8 lg:w-1/3">
        {did && <ScoreResultView did={did} />}
      </div>
    </div>
  )
}

export default Home
