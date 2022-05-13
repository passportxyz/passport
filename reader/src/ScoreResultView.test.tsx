import React from 'react'
import {render, screen} from "@testing-library/react";

import {ScoreResultView} from "./ScoreResultView"
import { usePublicRecord } from "@self.id/framework";

jest.mock('@self.id/framework', () => ({
  usePublicRecord: jest.fn()
}))

const mockedUsePublicRecord = usePublicRecord as jest.Mock

describe('the score result view', () => {
  it("should render a good score for a passport with stamps", async () => {
    mockedUsePublicRecord.mockImplementation(() => ({
      isLoading: false,
      content: {
        issuanceDate: "someDate",
        expiryDate: "someDate",
        stamps: ['a stamp!']
      }
    }))

    render(<ScoreResultView did={"abd123"}/>)
    expect(await screen.findByTestId("passport-score--good")).toBeInTheDocument();
  })

  it("should render a bad score for a passport with no stamps", async () => {
    mockedUsePublicRecord.mockImplementation(() => ({
      isLoading: false,
      content: {
        issuanceDate: "someDate",
        expiryDate: "someDate",
        stamps: []
      }
    }))

    render(<ScoreResultView did={""}/>)
    expect(await screen.findByTestId("passport-score--bad")).toBeInTheDocument();
  })
})
