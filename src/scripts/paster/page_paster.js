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

  if (message.key == "FindFirstEmpty"){
    console.log("Page_paster listener received FindFirstEmpty message.");
    FindFirstEmpty(message.value);
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
    console.log(descriptors.Fields)
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
    new_post_slug_hook(value);
    return true;
  }
  
  if ((field == "!Category")) {
    console.log("Category")
    category_hook(value);
    return true;
  }

  if ((field == "!WPDMTemplate")) {
    console.log("WPDMTemplate")
    wpdm_template(value);
    return true;
  }

}

// New post slug hook that clicks on a field, then adds the value and confirms it. 

function new_post_slug_hook(value){
  try{
    document.querySelector("button.edit-slug").click();
    document.querySelector("#new-post-slug").value = value;
    document.querySelector("#edit-slug-buttons button.save").click();
  } catch(error){
    console.log("Error in the new_post_slug_hook hook.")
    console.error(error)
  }
}

function category_hook(value){

  let wpm_categories = $("#wpdmcategory-all #wpdmcategorychecklist li");
  let categories = $("#category-all #categorychecklist li");
  let active_cat = categories;
  
  if (wpm_categories.length == 0){
    active_cat = categories
  }
  else{
    active_cat = wpm_categories
  }

  let cats = get_category_table(active_cat);

  let cat = cats.find((c) => { return c["name"] === value })

  if (cat != undefined){
    cat.input_element.checked = true
    console.log("Set category " + value)
  }

}

function get_category_table(category_nodes){
  // Go through category list and create an object of the possible elements.
  var category_list = [];
  $(category_nodes).each(function() {
    
    var category_element = $(this);
    let obj = {};
    
    var input = category_element.get(0).firstChild.firstChild;
    var name = category_element.children("label").text().trim()
    var ul = category_element.children("ul").get(0);

    if(ul != undefined)
    {
      ul = get_category_table(ul.children)
    }

    obj = {
      "name": name,
      "input_element": input,
      "subcategories": ul
      };
    category_list.push(obj);
  })
  return category_list;
}

function wpdm_template(value){
  let cat_span = document.querySelector("span.select2-selection.select2-selection--single");
  cat_span.focus()
  cat_span.click()

  let input = document.querySelector(".select2-search input.select2-search__field");
  input.value = value;

  let results = document.querySelector(".select2-pge_tpl-results li")
  if (results == null){
    console.error("No template found.")
  }
  results.click()
}


// Find First Empty value and scroll to it

function FindFirstEmpty(value)
{
  let parent = document.querySelector(value);
  console.log("selector: " + value);
  // If its a wordpress postbox, make sure its open.
  if(parent.classList.contains("postbox") && parent.classList.contains("closed"))
  {
    parent.classList.remove("closed");
  }
  let children = parent.querySelectorAll("input");
  console.log(" Children size: " + children.length)
  for (let i = 0; i < children.length; i++) {
    let input = children[i];
    console.log("input " + input.value);
    if(input.value == "")
      {
        window.scrollTo({
          behavior: 'smooth',
          top:
          input.getBoundingClientRect().top -
            document.body.getBoundingClientRect().top -
            100,
        })
        return;
      }
  }
}

// Misc Functions.

function get_page_lang(){
  console.log("Getting page lang...")
  var lang = document.querySelector("#wp-admin-bar-WPML_ALS .ab-item span").innerText.trim().slice(0, 2).toUpperCase();
  if (lang == "SP" | lang == ""){
    lang = "ES"
  }
  console.log("lang: " + lang)
  return lang;
}

function onError(error) {
  console.error(error)
}

console.log("Finished loading page_paster.js" )