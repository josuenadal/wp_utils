//
//
//
// Loaded popup/sidebar
//
//
//

document.addEventListener("DOMContentLoaded", get_descriptors_from_storage);

async function get_descriptors_from_storage() {
  console.log("Opened.");

  const changed = await browser.storage.local.get("Changed_Descriptors");

  if (changed.Changed_Descriptors == true) {
    // if(true){
    // Get Descriptors and generate pop up with em.
    browser.storage.local.get("Descriptors").then((result) => {
      // console.log("descriptors type: " + typeof result)
      generate_popup(JSON.parse(result.Descriptors));
      browser.storage.local.set({
        Func_Descriptors: result.Descriptors,
      });
    });

    browser.storage.local.set({ Changed_Descriptors: false }).then(msg("Done"));
  } else {
    // Get Descriptors and generate pop up with em.
    browser.storage.local.get("Func_Descriptors").then((result) => {
      generate_popup(JSON.parse(result.Func_Descriptors));
    });
  }
}

// Basically the whole page is generated in this function.

function generate_popup(result) {
  // console.log(result)

  if ((result == undefined) | (result.Forms == 0)) {
    print_message_only("No descriptors loaded. <br>Please load descriptors in the extension configuration page.");
    return;
  }

  let forms = result.Forms;

  for (const form_iter in forms) {
    let current_form = forms[form_iter];
    let id_string = "entry_" + form_iter;

    document
      .querySelector(".form-container")
      .insertAdjacentHTML(
        "beforeend",
        '<form id="' + id_string + '"> ' +
          '<div class="form-entries-container">' +
            '<div class="form-title prevent-select">' +
              '<h4 class="prevent-select">' + current_form["name"] + "</h4>" +
            "</div>" +
            '<div class="form-entry">' +
            "</div>" +
          "</div>" +
        "</form>"
      );

    document.querySelector("#" + id_string + " .form-title").addEventListener("click", toggle);
    
    // console.log("RAW ML " + current_form["multi_lang"])
    let multi_lang = parse_multi_lang_value(current_form["multi_lang"]);
    document
      .querySelector("#" + id_string + " .form-entries-container")
      .insertAdjacentHTML("afterbegin",'<input class=\"ml_val\" style=\"display:none;\" value=\"' + multi_lang + '\" />');

    let form_entry = document.querySelector("#" + id_string + " .form-entry");

    for (const field_iter in current_form["fields"]) {
      let val = "", es_val = "", en_val = "", read_only = "";
      val = parse_field_value(current_form["fields"][field_iter].value);
      es_val = parse_field_value(current_form["fields"][field_iter].es_value);
      en_val = parse_field_value(current_form["fields"][field_iter].en_value);
      if(typeof current_form["fields"][field_iter].read_only != "undefined" && String(current_form["fields"][field_iter].read_only).toUpperCase() == "TRUE"){
        read_only = "readOnly";
      }
      if(es_val == "" & en_val == "" & val != ""){
        es_val = val;
        en_val = val;
      }
      let type = parse_field_type(current_form["fields"][field_iter].type);
      if(multi_lang == true){
        form_entry.insertAdjacentHTML(
          "beforeend",
          '<div class="form-element">' +
            '<label>' + current_form["fields"][field_iter].field_name + '</label>' +
            '<br>' +
            print_css_selectors(current_form["fields"][field_iter].CSS_Selector) +
            '<br>' +
            'ES: <input type="' + type + '\" class=\"es\" value=\"' + es_val + '\"'+read_only+' />' +
            '<br>' +
            'EN: <input type="' + type + '\"  class=\"en\" value=\"' + en_val + '\"'+read_only+'/>' +
          "</div>"
        );
      }
      else{
        form_entry.insertAdjacentHTML(
          "beforeend",
          '<div class="form-element">' +
            '<label>' + current_form["fields"][field_iter].field_name + '</label>' +
            '<br>' +
            print_css_selectors(current_form["fields"][field_iter].CSS_Selector) +
            '<br>' +
            '<input type="' + type + '\" class=\"all\" value=\"' + val + '\"'+read_only+'/>'+
          "</div>"
        );
      }
    }

    form_entry.insertAdjacentHTML("beforeend", '<div class="form-element submit"><button type="button">Paste</button></div>');

    document.querySelector("#" + id_string + " button").addEventListener("click", handle_paste_click);

    console.log("\tGenerated " + id_string + ": " + current_form["name"]);
  }

  add_listeners_to_inputs();
  hide_forms();
  console.log("Done.");
}

//
// Functions for handling form creation
//

let acceptableTypes = ["text", "date"];

function parse_field_value(value_string) {
  if (typeof value_string == "undefined") {
    return "";
  } else {
    return value_string.replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
}

function print_css_selectors(css_selectors){
  if( Array.isArray(css_selectors) == false ){
    return '<small>' + css_selectors + '</small>';
  }
  let str = "";
  for (let i = 0; i < css_selectors.length; i++) {
    str += '<small>' + css_selectors[i] + '</small>';
    if ( i + 1 < css_selectors.length){
      str += '<br>';
    }
  }
  return str;
}

function multi_lang_input(ml_val, type, val, es_val, en_val){
  if(ml_val == true){
    return 'ES: <input type="' + type + '\" class=\"es\" value=\"' + es_val + '\" />' +
    '<br>' +
    'EN: <input type="' + type + '\"  class=\"en\" value=\"' + en_val + '\" />';
  }
  else{
    return '<input type="' + type + '\" class=\"all\" value=\"' + val + '\" />'
  }
}

function parse_multi_lang_value(ml_val){
  if (typeof ml_val == "undefined") {
    return false;
  }
  if (typeof ml_val == "boolean"){
    return ml_val;
  }
  if(ml_val.toUpperCase() == "TRUE"){
    return true;
  }
  if(ml_val.toUpperCase() == "FALSE"){
    return false;
  }
  return false;
}

function parse_field_type(type_string) {
  if ((typeof type_string == "undefined") | !acceptableTypes.includes(type_string.toLowerCase())) {
    return "text";
  } else {
    return type_string.toLowerCase();
  }
}

function print_message_only(msg) {
  document.querySelector(".form-container").insertAdjacentHTML("beforeend", "<h3>" + msg + "</h3>");
}

function hide_forms() {
  for (let entry of document.querySelectorAll(".form-entry")) {
    entry.classList.add("hidden");
  }
}

//
// Functions for handling form events
//

function add_listeners_to_inputs() {
  let inputs = document.getElementsByTagName("input");
  for (let i = 0; i < inputs.length; i++) {
    inputs[i].addEventListener("change", handle_form_change);
  }
  hide_forms();
}

function toggle(event) {
  let hidden = this.nextElementSibling.classList.contains("hidden");
  hide_forms();
  if (hidden) {
    this.nextElementSibling.classList.remove("hidden");
  } else {
    this.nextElementSibling.classList.add("hidden");
  }
}

function handle_form_change(event) {
  upload_form();
}

//
// Functions for form field update, always upload form changes for persistence
//

async function upload_form() {
  console.log("\tCreating form obj to upload...");

  let formObj = await turn_all_forms_back_into_json();
  await browser.storage.local.set({ Func_Descriptors: JSON.stringify(formObj) }).then();
}

async function turn_all_forms_back_into_json() {
  let desc_array = [];
  let des_obj = [];

  let matches = document.querySelectorAll("form");

  for (let i = 0; i < matches.length; i++) {
    desc_array = [];

    let name = document.querySelector("#entry_" + i + " h4").innerText;
    let ml_val = parse_multi_lang_value(document.querySelector("#entry_" + i + " .ml_val").value);

    let form_elements = document.querySelectorAll("#entry_" + i + " .form-element");
    for (let j = 0; j < form_elements.length; j++) {
      if (!form_elements[j].classList.contains("submit")) {

        let name = form_elements[j].querySelector("label").innerText;

        let css_selectors = [];
        let c_sels = form_elements[j].querySelectorAll("small").forEach((e) => {
          css_selectors.push(e.innerText);
        });

        if(ml_val){
          let es_val = form_elements[j].querySelector("input.es").value;
          let en_val = form_elements[j].querySelector("input.en").value;
          let type = form_elements[j].querySelector("input.es").type;
          let r_o = form_elements[j].querySelector("input.es").readOnly
          desc_array.push({ field_name: name, CSS_Selector: css_selectors, type: type, es_value: es_val, en_value: en_val, read_only: r_o });
        }
        else{
          let val = form_elements[j].querySelector("input.all").innerText;
          let type = form_elements[j].querySelector("input").type;
          let r_o = form_elements[j].querySelector("input.all").readOnly
          desc_array.push({ field_name: name, CSS_Selector: css_selectors, type: type, val: val, read_only: r_o });
        }
      }
    }
    des_obj.push({ name: name, multi_lang: ml_val, fields: desc_array });
  }
  let formObj = { Forms: des_obj };
  return formObj;
}

//
// Functions for handling paste action
//

async function handle_paste_click(event) {
  // event.preventDefault();
  // event.stopPropagation();
  // event.stopImmediatePropagation();
  await send_paste_data_to_page_from_form("#" + this.parentElement.parentElement.parentElement.parentElement.id);
}

async function send_paste_data_to_page_from_form(form_id) {
  console.log("\tCreating object from form " + form_id);

  let formObj = get_json_paste_data_from_single_form(form_id);

  const tab = await browser.tabs.query({ currentWindow: true, active: true }).then((t)=> {return t[0]});

  await browser.tabs.sendMessage(tab.id, { key: "descriptor", value: formObj })
    .then((r)=>{if(r.response == "GOOD"){console.log("Sucesfully sent descriptors obj to tab " + tab.url);}}, onError)
}

function get_json_paste_data_from_single_form(CSSSelector) {
  let formObj = { Fields: {} };
  let field_Arr = [];
  let matches = document.querySelectorAll(CSSSelector + " .form-element");

  for (let i = 0; i < matches.length; i++) {
    if (!matches[i].classList.contains("submit")) {

      let css_selectors = [];
      let c_sels = matches[i].querySelectorAll("small").forEach((e) => {
        css_selectors.push(e.innerText);
      });
      
      if(document.querySelector(CSSSelector + " .ml_val").value == "false"){
        let val = matches[i].querySelector("input.all").value;
        field_Arr.push({ CSS_Selector: css_selector, multi_lang: false, value: val });
      }
      
      if(document.querySelector(CSSSelector + " .ml_val").value == "true"){
        let es_val = matches[i].querySelector("input.es").value;
        let en_val = matches[i].querySelector("input.en").value;
        field_Arr.push({ CSS_Selector: css_selectors, multi_lang: true, es_value: es_val, en_value: en_val });
      }
    }
  }

  formObj.Fields = field_Arr;
  return formObj;
}

//
// Quick action buttons
//

// Not implemented yet...
function GoToEmptyAmmendment(){
  document.querySelector("[id='Enmiendas de Contratos']").classList.remove("closed")
}

//
// Misc functions
//

function msg(msg) {
  console.log(msg);
}

function onError(error) {
  console.log(error);
}
