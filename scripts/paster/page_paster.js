"use strict";

//
//
//			Listen for the message from the backend with form obj for fields to paste to
//
//

if (!browser.runtime.onMessage.hasListener(descriptor_receiver)) {
  browser.runtime.onMessage.addListener(descriptor_receiver).then(console.log("Added descriptor message receiver.")).catch(onError);
}

function descriptor_receiver(message) {

  console.log("Page_paster received a message.");

  if (message.key == "descriptor") {
    console.log("Received the descriptors for copying.");
    paste_data(message.value);
  }
  return Promise.resolve({ response: "Received descriptors" });
}

//
//
//			Use descriptor fields and values to paste info onto the fields of the page.
//
//

function paste_data(descriptors) {
  console.log("Descriptors for copying " + JSON.stringify(descriptors));

  for (let i = 0; i < descriptors.Fields.length; i++) {

    var selector = descriptors.Fields[i][0];
    var value = descriptors.Fields[i][1];

    console.log(" pairs = " + selector + " and " + value);

    if (hooks_handler(selector, value)) {
      continue;
    }

    document.querySelectorAll(selector).forEach((e) => {
      e.value = value;
    });
  }
}

function hooks_handler(field, value){

  if(value == ""){
    return true;
  }

  // Any sort of hooks that require more than simply editing the value of the element.

  if ((field == "#new-post-slug")) {
    console.log("New post")
    new_post_slug_handler(field,value);
    return true;
  }

}

function new_post_slug_handler(field, value){
  document.querySelector("button.edit-slug").click();
  document.querySelector("#new-post-slug").value = value;
  document.querySelector("#edit-slug-buttons button.save").click();
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
