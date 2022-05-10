import React from 'react'
import { render, screen, waitFor } from "@testing-library/react";

import {ScoreResultView} from "../../components/ScoreResultView"

jest.mock('@self.id/react', () => {
  usePublicRecord: () => {

  }
})

describe('the score result view', () => {
  it("should render a score for a given passport", () => {

    expect(screen.())
  })

  it("should render an error if no did provided", () => {

    expect(screen.())
  })
})