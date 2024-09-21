"use strict";

//
//			Listen for the message from the backend with the stored shortcode
//			when you switch to another editing tab.
//
if (!browser.runtime.onMessage.hasListener(shortcode_listener)) {
  browser.runtime.onMessage.addListener(shortcode_listener);
}

function shortcode_listener(message) {

  console.log("Page_shortcode_handler received a message");
  if ((message.key == "copiedShortcode") & (message.key != null)) {
    localStorage.setItem(message.key, message.value);
  } else if (message.key == "setListeners") {
    document.querySelectorAll(".column_copy, .vc_control-btn-copy").forEach((btn) => {
      btn.removeEventListener("click", copyClicked);
      btn.addEventListener("click", copyClicked,{once: true});
    });
    return Promise.resolve({ response: "Good messages" });
  }
}

//
//			Set listeners on every copy button on the page.
//

document.querySelectorAll(".column_copy, .vc_control-btn-copy").forEach((btn) => {
  btn.removeEventListener("click", copyClicked,{once: true});
  btn.addEventListener("click", copyClicked,{once: true});
});

//
//			When you click copy on the editor, this will then take the shortcode
//			from the page's local storage and set it in the browser storage.
//

async function copyClicked(event) {
  
  console.log("Copy click detected.");

  //Remove shortcode stored in browser
  await browser.storage.local.remove("stored_shortCode").catch(onError);

  //Retrieve shortcode stored by WP_Bakery
  var copiedShortcode = localStorage.getItem("copiedShortcode");

  if (copiedShortcode == null) {
    alert("No Code");
    return;
  }

  browser.storage.local.set({ stored_shortCode: copiedShortcode }).then(showAlert(event)).catch(onError);
}

var wp_utils_debug_val = true;

function wp_utils_debug_output(msg) {
  if (wp_utils_debug_val) {
    console.log(msg);
  }
  return;
}

function onError(error) {
  console.error(`Error: ${error}`);
}

function msg(msg) {
  console.log(msg);
}

function showAlert(event) {
  alert("Copied to browser storage");
}

var hasBeenExecuted = true;
