import React from "react";
import { fireEvent, render, waitFor, screen, waitForElementToBeRemoved } from "@testing-library/react";
import { RemoveStampModal } from "../../components/RemoveStampModal";
import { closeAllToasts } from "../../__test-fixtures__/toastTestHelpers";

describe("RemoveStampModal", () => {
  const renderRemoveStampModal = ({ handleDeleteStamps }: { handleDeleteStamps: () => any }) =>
    render(
      <RemoveStampModal
        isOpen={true}
        onClose={() => {}}
        handleDeleteStamps={handleDeleteStamps}
        title="Test Title"
        body="Test Body"
        platformId="ETH"
      />
    );

  beforeEach(async () => {
    await closeAllToasts();
  });

  it("should show success toast on successful delete", async () => {
    let deletedMock = jest.fn();
    const { getByText } = renderRemoveStampModal({
      handleDeleteStamps: deletedMock,
    });

    const deleteButton = getByText("Remove Stamp").closest("button");
    expect(deleteButton).toBeInTheDocument();
    deleteButton && fireEvent.click(deleteButton);

    await waitFor(() => expect(deletedMock).toHaveBeenCalled());

    expect(getByText("Stamp data has been removed.")).toBeInTheDocument();
  });
  it("should show error toast on failed delete", async () => {
    const { getByText } = renderRemoveStampModal({
      handleDeleteStamps: () => {
        throw new Error("Test Error");
      },
    });

    const deleteButton = getByText("Remove Stamp").closest("button");
    expect(deleteButton).toBeInTheDocument();
    deleteButton && fireEvent.click(deleteButton);

    expect(getByText("Something went wrong. Please try again.")).toBeInTheDocument();
  });
});
