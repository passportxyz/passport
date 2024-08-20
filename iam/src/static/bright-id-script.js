function initiateCallBack() {
  const queryString = new URLSearchParams(window?.location?.search);
  const callback = queryString.get("callback");
  window.location.replace(callback + "?error=false&code=null&state=brightid");
}

// Get User Did from URL
const queryString = new URLSearchParams(window?.location?.search);
const userDid = queryString.get("userDid");

// Generate QR Code
const qrcode = new QRCode(document.getElementById("brightid-qrcode"), {
  text: `brightid://link-verification/http:%2f%2fnode.brightid.org/Gitcoin/${userDid}`,
  width: 256,
  height: 256,
  colorDark: "#000000",
  colorLight: "#ffffff",
  correctLevel: QRCode.CorrectLevel.H,
});

// Generate BrightId Link and append to anchor tag
const brightIdLink = document.getElementById("bright-id-link");
brightIdLink.href = `https://app.brightid.org/link-verification/http:%2f%2fnode.brightid.org/Gitcoin/${userDid}`;

const brightIdSponsorButton = document.getElementById("button-sponsor-brightid");
brightIdSponsorButton.addEventListener("click", initiateCallBack);
