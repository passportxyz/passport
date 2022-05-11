import React from 'react'
import { render, screen, waitFor } from "@testing-library/react";

import {ScoreResultView} from "../../components/ScoreResultView"

jest.mock('@self.id/react', () => ({
  usePublicRecord: jest.fn((_, did) => ({
    content: {
      issuanceDate: "someDate",
      expiryDate: "someDate",
      stamps: did && ["test"] || []
    }
  }))
}))

describe('the score result view', () => {
  it("should render a good score for a passport with stamps", async () => {
    render(<ScoreResultView did={"abd123"} />)
    screen.getByTestId("passport-score--good")
    expect(await screen.queryByTestId("passport-score--bad")).not.toBeInTheDocument();
  })

  it("should render a bad score for a passport with no stamps", async () => {
    render(<ScoreResultView did={""}/>)
    expect(await screen.queryByTestId("passport-score--good")).not.toBeInTheDocument();
    screen.getByTestId("passport-score--bad");
  })
})
