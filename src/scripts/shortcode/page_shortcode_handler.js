"use strict";

//  ███████╗██╗  ██╗ ██████╗ ██████╗ ████████╗ ██████╗ ██████╗ ██████╗ ███████╗        ██╗  ██╗ █████╗ ███╗   ██╗██████╗ ██╗     ███████╗██████╗
//  ██╔════╝██║  ██║██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝██╔═══██╗██╔══██╗██╔════╝        ██║  ██║██╔══██╗████╗  ██║██╔══██╗██║     ██╔════╝██╔══██╗
//  ███████╗███████║██║   ██║██████╔╝   ██║   ██║     ██║   ██║██║  ██║█████╗          ███████║███████║██╔██╗ ██║██║  ██║██║     █████╗  ██████╔╝
//  ╚════██║██╔══██║██║   ██║██╔══██╗   ██║   ██║     ██║   ██║██║  ██║██╔══╝          ██╔══██║██╔══██║██║╚██╗██║██║  ██║██║     ██╔══╝  ██╔══██╗
//  ███████║██║  ██║╚██████╔╝██║  ██║   ██║   ╚██████╗╚██████╔╝██████╔╝███████╗███████╗██║  ██║██║  ██║██║ ╚████║██████╔╝███████╗███████╗██║  ██║
//  ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝
//

//
// Set listeners on every copy button on the page.
//

const once = {
  once: true,
};

$( ".metabox-composer-content" ).ready(function() {
  document.querySelectorAll(".column_copy, .vc_control-btn-copy").forEach((btn) => {
    btn.addEventListener("click", copyClicked);
  });
  console.log("\tAdded listeners on copy buttons.")
});

//
// Listen for the message from the backend with the stored shortcode.
//

if (browser.runtime.onMessage.hasListener(shortcode_listener) == false) {
  browser.runtime.onMessage.addListener(shortcode_listener);
  console.log("\tAdded message listener.")
}

function shortcode_listener(message) {
  if (message.key == "copiedShortcode") {
    // Received shortcode, set it into the pages storage so it can be retreived by WP_Bakery on paste.
    console.log("Page_shortcode_handler received shortcodes");
    localStorage.setItem(message.key, message.value);
    return Promise.resolve({ response: "GOOD" });
  } else if (message.key == "setListeners") {
    // Set listeners in case page 
    console.log("Page_shortcode_handler received setListeners message");
    document.querySelectorAll(".column_copy, .vc_control-btn-copy").forEach((btn) => {
      btn.addEventListener("click", copyClicked);
    });
    return Promise.resolve({ response: "GOOD" });
  }
}

//
// When you click copy on the WPBakery editor, this will take the shortcode
// from the page's local storage and set it in the browser storage. 
// 
// Later on a tab change event, the background script will send the shortcode from the
// browser storage into the new tab. 
//

async function copyClicked(event) {
  console.log("Copy click detected.");

  // Retrieve shortcode stored by WP_Bakery.
  var copiedShortcode = localStorage.getItem("copiedShortcode");

  if (copiedShortcode == null | typeof copiedShortcode == "undefined") {
    alert("No Code");
    return;
  }

  // Remove shortcode stored in browser.
  await browser.storage.local.remove("stored_shortCode").catch(onError);

  // Set shortcode in browser.
  browser.storage.local.set({ stored_shortCode: copiedShortcode }).then(console.log("Copied shortcode to browser storage"), onError);
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

console.log("Finished adding page_shortcode_handler.js...")