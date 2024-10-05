"use strict";

//  ███████╗██╗  ██╗ ██████╗ ██████╗ ████████╗ ██████╗ ██████╗ ██████╗ ███████╗        ██╗  ██╗ █████╗ ███╗   ██╗██████╗ ██╗     ███████╗██████╗
//  ██╔════╝██║  ██║██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝██╔═══██╗██╔══██╗██╔════╝        ██║  ██║██╔══██╗████╗  ██║██╔══██╗██║     ██╔════╝██╔══██╗
//  ███████╗███████║██║   ██║██████╔╝   ██║   ██║     ██║   ██║██║  ██║█████╗          ███████║███████║██╔██╗ ██║██║  ██║██║     █████╗  ██████╔╝
//  ╚════██║██╔══██║██║   ██║██╔══██╗   ██║   ██║     ██║   ██║██║  ██║██╔══╝          ██╔══██║██╔══██║██║╚██╗██║██║  ██║██║     ██╔══╝  ██╔══██╗
//  ███████║██║  ██║╚██████╔╝██║  ██║   ██║   ╚██████╗╚██████╔╝██████╔╝███████╗███████╗██║  ██║██║  ██║██║ ╚████║██████╔╝███████╗███████╗██║  ██║
//  ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝
//

//
// Listen for the message from the backend with the stored shortcode
// when you switch to another editing tab.
//

if (browser.runtime.onMessage.hasListener(shortcode_listener) == false) {
  browser.runtime.onMessage.addListener(shortcode_listener);
}

const once = {
  once: true,
};

function shortcode_listener(message) {
  if (message.key == "copiedShortcode") {
    console.log("Page_shortcode_handler received shortcodes");
    localStorage.setItem(message.key, message.value);
  } else if (message.key == "setListeners") {
    console.log("Page_shortcode_handler received setListeners message");
    document.querySelectorAll(".column_copy, .vc_control-btn-copy").forEach((btn) => {
      btn.addEventListener("click", copyClicked, once);
    });
    return Promise.resolve({ response: "Good messages" });
  }
}

//
// Set listeners on every copy button on the page.
//

document.querySelectorAll(".column_copy, .vc_control-btn-copy").forEach((btn) => {
  btn.addEventListener("click", copyClicked, once);
});

//
// When you click copy on the WPBakery editor, this will take the shortcode
// from the page's local storage and set it in the browser storage. 
// 
// Later on a tab change event, the background script will send the shortcode from the
// browser storage into the new tab. 
//

async function copyClicked(event) {
  console.log("Copy click detected.");

  // Remove shortcode stored in browser
  await browser.storage.local.remove("stored_shortCode").catch(onError);

  // Retrieve shortcode stored by WP_Bakery
  var copiedShortcode = localStorage.getItem("copiedShortcode");

  if (copiedShortcode == null) {
    alert("No Code");
    return;
  }

  browser.storage.local.set({ stored_shortCode: copiedShortcode }).then(console.log("Copied to browser storage")).catch(onError);
}

//
// Misc Functions
//

function onError(error) {
  console.error(error);
}

function msg(msg) {
  console.log(msg);
}
