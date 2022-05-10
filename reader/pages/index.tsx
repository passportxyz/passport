import type {NextPage} from 'next'
import Head from 'next/head'

import React, {useState} from 'react'
import {ScoreResultView} from "../components/ScoreResultView";

const Home: NextPage = () => {
  const [did, setDid] = useState<string>('')
  const [didInput, setDidInput] = useState<string>('')

  const scorePassport = () => {
    setDid(didInput)
  }

  return (
    <div className="p-20 flex min-h-screen flex-row items-center justify-center py-2">
      <Head>
        <title>Passport Reader</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="mx-auto flex">
        <div className="mb-6 w-2/3 w-full py-6">
          <div className="text-black text-xl font-bold">
            A Decentralized Scorer Application
          </div>
          <div className="font-libre-franklin mt-10 text-xl md:w-1/3">
            Project dPopp is a passport for Web3 citizens - issued through a collection of trusted
            sources that confirm your identity. Designed to provide proof through your passport, dPopp
            verifies your Personhood strengthening your sybil resistance. Decentralized on Ceramic Network.
          </div>
          <div className="mb-10 mt-10 md:w-1/4">
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
              className="rounded border-0 py-2 px-6 text-lg text-white bg-indigo-400 hover:bg-indigo-600 focus:outline-none"
            >
              <p className="text-base">Score My Passport</p>
            </button>
          </div>
        </div>
        <div className="mb-6 w-1/3 w-full py-6">
          { did && <ScoreResultView did={did} /> }
        </div>
      </div>
    </div>
  )
}

export default Home;
