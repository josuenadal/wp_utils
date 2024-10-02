async function send_form_data_to_tab(form_id) {
  console.log("\tCreating object from form " + form_id);

  var formObj = get_submitted_form_fields_json_obj_for_pasting(form_id);

  const tab = await browser.tabs
    .query({ currentWindow: true, active: true })
    .then()
    .catch(onError);

  await browser.tabs
    .sendMessage(tab[0].id, { key: "descriptor", value: formObj })
    .then(msg("Succesfully sent descriptors form obj"))
    .catch(onError);
}

function get_submitted_form_fields_json_obj_for_pasting(CSSSelector) {
  let formObj = { Fields: {} };

  let field_Arr = [];

  var matches = document.querySelectorAll(CSSSelector + " .form-element");

  for (let i = 0; i < matches.length; i++) {
    if (!matches[i].classList.contains("submit")) {
      var label = matches[i].querySelector("label").innerText;
      var field = matches[i].querySelector("input").value;
      formObj.Fields[label] = field;
      field_Arr.push([label, field]);
    }
  }

  formObj.Fields = field_Arr;

  return formObj;
}

function get_descriptor_obj_from_all_forms(CSSSelector) {
  let formObj = { Descriptor: {} };
  let desc_array = [];
  let des_obj = {};

  var matches = document.querySelectorAll("form");

  for (let i = 0; i < matches.length; i++) {
    des_obj = {};

    var id = matches[i].id;
    var name = matches[i].querySelector(".form-title H3").innerText;
    let fieldObj = get_submitted_form_fields_json_obj_for_pasting("#" + id);

    des_obj["name"] = name;
    des_obj["fields"] = fieldObj.Fields;

    desc_array.push(des_obj);
  }
  formObj.Descriptor = desc_array;

  console.log("Form obj for upload = " + JSON.stringify(formObj));
  return formObj;
}

document.addEventListener("DOMContentLoaded", get_descriptors_from_storage);

async function get_descriptors_from_storage() {
  console.log("Opened pop up.");

  var changed = await browser.storage.local.get("Changed_Descriptors");

  if (changed.Changed_Descriptors == true) {
    // Get Descriptors and generate pop up with em.
    browser.storage.local
      .get("Descriptors")
      .then((result) => {
        generate_popup(JSON.parse(result.Descriptors));
        browser.storage.local.set({
          Func_Descriptors: JSON.parse(result.Descriptors),
        });
      })
      .catch(onError);

    browser.storage.local.set({ Changed_Descriptors: false }).then(msg("Done"));
  } else {
    // Get Descriptors and generate pop up with em.
    browser.storage.local
      .get("Func_Descriptors")
      .then((result) => generate_popup(result.Func_Descriptors))
      .catch(onError);
  }

  return Promise.resolve({ response: "Received descriptors" });
}

function generate_popup(result) {
  if (result == undefined) {
    print_message_only(
      "No descriptors loaded.<br>Please load descriptors in the extension configuration page."
    );
    return;
  }

  console.log(result);
  let json = result;
  var id_count = 0;

  for (const Desc in json.Descriptor) {
    id_count += 1;
    // console.log(json.Descriptor[Desc])
    var id_string = "entry_" + id_count;

    document
      .querySelector(".form-container")
      .insertAdjacentHTML(
        "beforeend",
        '<form id="' +
          id_string +
          '"> <div class="form-entries-container"> <div class="form-entry"> </div> </div> </form>'
      );

    var form_entry = document.querySelector("#" + id_string + " .form-entry");

    document
      .querySelector("#" + id_string + " .form-entries-container")
      .insertAdjacentHTML(
        "afterbegin",
        '<div class="form-title prevent-select"><h3 class="prevent-select">' +
          json.Descriptor[Desc]["name"] +
          "</h3></div>"
      );

    document
      .querySelector("#" + id_string + " .form-title")
      .addEventListener("click", toggle, { once: true });

    for (const f in json.Descriptor[Desc]["fields"]) {
      form_entry.insertAdjacentHTML(
        "beforeend",
        '<div class="form-element"><label>' +
          json.Descriptor[Desc]["fields"][f][0] +
          '</label><br><input type="text" value=\'' +
          json.Descriptor[Desc]["fields"][f][1].replace(/"/g, '&quot;').replace(/'/g, '&apos;') +
          '\' /></div>'
      );
    }

    form_entry.insertAdjacentHTML(
      "beforeend",
      '<div class="form-element submit"><button type="submit">Paste</button></div>'
    );

    document
      .querySelector("#" + id_string + " button")
      .addEventListener("click", handle_form_submit, { once: true });

    console.log(
      "\tGenerated " + id_string + ": " + json.Descriptor[Desc]["name"]
    );
  }

  if (id_count == 0) {
    print_message_only(
      "No descriptors loaded. <br>Please load descriptors in the extension configuration page."
    );
    return;
  }

  add_listeners_to_inputs();
  hide_forms();
  console.log("Done.");
}

function print_message_only(msg) {
  document
    .querySelector(".form-container")
    .insertAdjacentHTML("beforeend", "<h3>" + msg + "</h3>");
}

function toggle(event) {
  var open_it = false;
  if (this.nextElementSibling.classList.contains("hidden")) {
    open_it = true;
  }

  hide_forms();

  if (open_it) {
    this.nextElementSibling.classList.remove("hidden");
  }
}

function handle_form_submit(event) {
  event.preventDefault();
  send_form_data_to_tab(
    "#" + this.parentElement.parentElement.parentElement.parentElement.id
  );
}

function handle_form_change(event) {
  upload_form();
}

function msg(msg) {
  console.log(msg);
}

function onError(error) {
  console.log(`Error: ${error}`);
}

function add_listeners_to_inputs() {
  var inputs = document.getElementsByTagName("input");
  for (let i = 0; i < inputs.length; i++) {
    inputs[i].addEventListener("change", handle_form_change, { once: true });
  }
  hide_forms();
}

function hide_forms() {
  for (let entry of document.querySelectorAll(".form-entry")) {
    entry.classList.add("hidden");
  }
}

function upload_form() {
  console.log("\tCreating form obj to upload...");

  var formObj = get_descriptor_obj_from_all_forms();
  console.log(formObj);
  browser.storage.local.set({ Func_Descriptors: formObj });
}
