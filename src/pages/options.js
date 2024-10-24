//
//
//  Save options in the option page.
//
//

document
  .querySelector("form")
  .addEventListener("submit", save_options, { once: true });

async function save_options() {
  console.log("Saving...");
  browser.storage.local
    .set({
      Left_Env_Link: document.querySelector("#Left_Env_Link").value,
      Right_Env_Link: document.querySelector("#Right_Env_Link").value,
      Descriptors: document.querySelector("#Descriptors").value,
      Changed_Descriptors: true,
    })
    .then(msg("Done"));
}

//
//
//  Restore options when opening the options panel.
//
//

//  Listener that detects when options have been opened.
document.addEventListener("DOMContentLoaded", restore_options);

//  Function that returns the options from the extension storage.
async function restore_options() {

  // Put the content into the page.
  function restoreCSSSelector(selector, value) {
    if (value != undefined) {
      document.querySelector(selector).value = value;
    }
  }

  await browser.storage.local
    .get("Left_Env_Link")
    .then(
      (val) => restoreCSSSelector("#Left_Env_Link", val.Left_Env_Link),
      onError
    );

  await browser.storage.local
    .get("Right_Env_Link")
    .then(
      (val) => restoreCSSSelector("#Right_Env_Link", val.Right_Env_Link),
      onError
    );

  await browser.storage.local
    .get("Descriptors")
    .then(
      (val) => restoreCSSSelector("#Descriptors", val.Descriptors),
      onError
    );
}

function onError(error) {
  console.log(`Error: ${error}`);
}

function msg(msg) {
  console.log(msg);
}
