"use strict";


//   ██████╗ ██╗   ██╗██╗ ██████╗██╗  ██╗        ██████╗  █████╗ ███████╗████████╗███████╗██████╗ 
//  ██╔═══██╗██║   ██║██║██╔════╝██║ ██╔╝        ██╔══██╗██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗
//  ██║   ██║██║   ██║██║██║     █████╔╝         ██████╔╝███████║███████╗   ██║   █████╗  ██████╔╝
//  ██║▄▄ ██║██║   ██║██║██║     ██╔═██╗         ██╔═══╝ ██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗
//  ╚██████╔╝╚██████╔╝██║╚██████╗██║  ██╗███████╗██║     ██║  ██║███████║   ██║   ███████╗██║  ██║
//   ╚══▀▀═╝  ╚═════╝ ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
//  

const page_lang = get_page_lang();

//
// Listen for the message from the backend with form obj for fields to paste to
//

browser.runtime.onMessage.addListener(descriptor_receiver);

function descriptor_receiver(message) {
  if (message.key == "descriptor") {
    console.log("Page_paster listener received message with descriptors.");
    paste_data(message.value);
    return Promise.resolve({ response: "GOOD" });
  }
}

//
// Use descriptor fields and values to paste info onto the fields of the page.
//

function paste_data(descriptors) {
  console.log("Descriptors for copying " + JSON.stringify(descriptors));

  for (let i = 0; i < descriptors.Fields.length; i++) {

    let selectors = descriptors.Fields[i].CSS_Selector;
    let ml_val = descriptors.Fields[i].multi_lang;
    
    let val = descriptors.Fields[i].value;
    let es_val = descriptors.Fields[i].es_value;
    let en_val = descriptors.Fields[i].en_value;
    console.log(selectors, ml_val, val, es_val, en_val)

    let value = "";
    if( ml_val == "false" ){
      value = val;
    }
    else{
      if(page_lang == "ES"){
        value = es_val;
      }

      if(page_lang == "EN"){
        value = en_val;
      }
    }

    console.log(" pairs = " + selectors + " and " + value);

    if(Array.isArray(selectors))
    {
      for(let j = 0; j < selectors.length; j++){
        if (hooks_handler(selectors[j], value)) {
          continue;
        }
    
        document.querySelectorAll(selectors[j]).forEach((e) => {
          e.value = value;
        });
      }
    }
    else{
      if (hooks_handler(selectors, value)) {
        continue;
      }
  
      document.querySelectorAll(selectors).forEach((e) => {
        e.value = value;
      });
    }
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

function get_page_lang(){
  let params = new URL(window.location.href).searchParams;
  let lang = params.get("lang");
  if(lang != null){
    return lang.toUpperCase();
  }
  return "ES";
}

function onError(error) {
  console.error(error)
}

console.log("Finished loading page_paster.js" )