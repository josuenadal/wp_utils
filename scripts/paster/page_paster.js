"use strict";


//   ██████╗ ██╗   ██╗██╗ ██████╗██╗  ██╗        ██████╗  █████╗ ███████╗████████╗███████╗██████╗ 
//  ██╔═══██╗██║   ██║██║██╔════╝██║ ██╔╝        ██╔══██╗██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗
//  ██║   ██║██║   ██║██║██║     █████╔╝         ██████╔╝███████║███████╗   ██║   █████╗  ██████╔╝
//  ██║▄▄ ██║██║   ██║██║██║     ██╔═██╗         ██╔═══╝ ██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗
//  ╚██████╔╝╚██████╔╝██║╚██████╗██║  ██╗███████╗██║     ██║  ██║███████║   ██║   ███████╗██║  ██║
//   ╚══▀▀═╝  ╚═════╝ ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
//   

//
//
// Listen for the message from the backend with form obj for fields to paste to
//
//

browser.runtime.onMessage.addListener(descriptor_receiver);

function descriptor_receiver(message) {
  if (message.key == "descriptor") {
    console.log("Page_paster received message with descriptors.");
    paste_data(message.value);
  }
  return Promise.resolve({ response: "Received descriptors" });
}

//
//
// Use descriptor fields and values to paste info onto the fields of the page.
//
//

function paste_data(descriptors) {
  console.log("Descriptors for copying " + JSON.stringify(descriptors));

  for (let i = 0; i < descriptors.Fields.length; i++) {

    var selector = descriptors.Fields[i].CSS_Selector;
    var value = descriptors.Fields[i].value;

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
    new_post_slug_hook(field,value);
    return true;
  }

}

// New post slug hook that clicks on a field, then adds the value and confirms it. 

function new_post_slug_hook(field, value){
  try{
    document.querySelector("button.edit-slug").click();
    document.querySelector("#new-post-slug").value = value;
    document.querySelector("#edit-slug-buttons button.save").click();
  } catch(error){
    console.log("Error in the new_post_slug_hook hook.")
    console.error(error)
  }
}

// Misc Functions.

function onError(error) {
  console.error(error)
}