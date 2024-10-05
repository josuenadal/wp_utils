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
              '<h3 class="prevent-select">' + current_form["name"] + "</h3>" +
            "</div>" +
            '<div class="form-entry">' +
            "</div>" +
          "</div>" +
        "</form>"
      );

    document.querySelector("#" + id_string + " .form-title").addEventListener("click", toggle);

    let form_entry = document.querySelector("#" + id_string + " .form-entry");

    for (const field_iter in current_form["fields"]) {
      let val = parse_field_value(current_form["fields"][field_iter].value);
      let type = parse_field_type(current_form["fields"][field_iter].type);
      form_entry.insertAdjacentHTML(
        "beforeend",
        '<div class="form-element">' +
          '<label>' + current_form["fields"][field_iter].field_name + '</label>' +
          '<br>' +
          '<small>' + current_form["fields"][field_iter].CSS_Selector + '</small>' +
          '<br>' +
          '<input type="' + type + '\" value=\"' + val + '\" />' +
        "</div>"
      );
    }

    form_entry.insertAdjacentHTML("beforeend", '<div class="form-element submit"><button>Paste</button></div>');

    document.querySelector("#" + id_string + " button").addEventListener("click", handle_paste_click, { once: true });

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
    inputs[i].addEventListener("change", handle_form_change, { once: true });
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

    let name = document.querySelector("#entry_" + i + " h3").innerText;

    let form_elements = document.querySelectorAll("#entry_" + i + " .form-element");
    for (let j = 0; j < form_elements.length; j++) {
      if (!form_elements[j].classList.contains("submit")) {
        let name = form_elements[j].querySelector("label").innerText;
        let css_selector = form_elements[j].querySelector("small").innerText;
        let value = form_elements[j].querySelector("input").value;
        let type = form_elements[j].querySelector("input").type;
        desc_array.push({ field_name: name, CSS_Selector: css_selector, type: type, value: value });
      }
    }
    des_obj.push({ name: name, fields: desc_array });
  }
  let formObj = { Forms: des_obj };
  return formObj;
}

//
// Functions for handling paste action
//

async function handle_paste_click(event) {
  event.preventDefault();
  event.stopPropagation();
  await send_paste_data_to_page_from_form("#" + this.parentElement.parentElement.parentElement.parentElement.id);
}

async function send_paste_data_to_page_from_form(form_id) {
  console.log("\tCreating object from form " + form_id);

  let formObj = get_json_paste_data_from_single_form(form_id);

  const tab = await browser.tabs.query({ currentWindow: true, active: true }).then();

  await browser.tabs.sendMessage(tab[0].id, { key: "descriptor", value: formObj }).then(msg("Succesfully sent descriptors form obj"));
}

function get_json_paste_data_from_single_form(CSSSelector) {
  let formObj = { Fields: {} };
  let field_Arr = [];
  let matches = document.querySelectorAll(CSSSelector + " .form-element");

  for (let i = 0; i < matches.length; i++) {
    if (!matches[i].classList.contains("submit")) {
      let css_selector = matches[i].querySelector("small").innerText;
      let value = matches[i].querySelector("input").value;

      field_Arr.push({ CSS_Selector: css_selector, value: value });
    }
  }

  formObj.Fields = field_Arr;
  return formObj;
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
