// --- React Methods
import React from "react";

export default function Privacy() {
  return (
    <div className="font-miriam-libre min-h-max min-h-default bg-purple-darkpurple text-gray-100">
      <div className="container mx-auto px-5 py-2">
        <div className="mx-auto flex flex-wrap">
          <div className="w-full py-6 text-white">
            <img src="/assets/GitcoinLogoAndName.svg" alt="logo" className="mt-0 sm:mt-40 md:mt-40" />
            <div className="font-miriam-libre mt-10 leading-relaxed">
              <p className="text-5xl sm:text-7xl md:text-5xl">dPassport Data Deletion Instructions</p>
            </div>
            <div className="font-miriam-libre mt-2 text-lg sm:mt-10 sm:text-xl md:mt-10 md:text-xl">
              Accessing, Updating, Correcting, and Deleting your Information
            </div>
            <div className="font-mariam-libre mt-0 text-sm sm:text-base md:mt-10 md:text-base">
              You may access information that you have voluntarily provided through your account on the Services, and to
              review, correct, or delete it by sending a request to privacy@gitcoin.co. You can request to change
              contact choices, opt-out of our sharing with others, and update your personal information and preferences.
              <br />
              <br />
              For full privacy policy, see{" "}
              <a href={"https://gitcoin.co/legal/privacy"}>
                <u>https://gitcoin.co/legal/privacy</u>
              </a>
              .
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
