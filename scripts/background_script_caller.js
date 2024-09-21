//
//			Listen for tab changes
//
if (!browser.tabs.onActivated.hasListener((event) => handle_tab_event(event))) {
  browser.tabs.onActivated.addListener((event) => handle_tab_event(event));
}

//
//			When you switch tabs this will detect if it is one of the configured domains,
//			then it will retreive the shortcode from the browser storage and
//			send it to the tab as a message.
//

async function send_shortcode_message(tabId) {

  var tab = await browser.tabs
    .get(tabId)
    .then()
    .catch(onError);

  var left_link = await browser.storage.local
    .get("Left_Env_Link")
    .then((result) => {
      return result.Left_Env_Link;
    })
    .catch(onError);

  var right_link = await browser.storage.local
    .get("Right_Env_Link")
    .then((result) => {
      return result.Right_Env_Link;
    })
    .catch(onError);

  console.log("Sending message to tab ".concat(tabId));

  var stored_shortcode = await browser.storage.local
    .get("stored_shortCode")
    .then((result) => {
      return result.stored_shortCode;
    })
    .catch(onError);

  await browser.tabs.sendMessage(tabId, { key: "copiedShortcode", value: stored_shortcode })
    .then(console.log("Succesfully sent message to ".concat(tab.url)))
    .catch(onError);
}

async function execute_scripts(tabId) {
  await browser.scripting.executeScript({
    target: {
      tabId: tabId,
      allFrames: true,
    },
    files: ["scripts/shortcode/page_shortcode_handler.js"],
  });

  await browser.scripting.executeScript({
    target: {
      tabId: tabId,
      allFrames: true,
    },
    files: ["scripts/paster/page_paster.js"],
  });

  send_shortcode_message(tabId).then();
}

async function initial_run() {

  var permissionsArray = await browser.permissions.getAll().then((r) => r.origins);

  var tabs = await browser.tabs.query({});

  tabs.forEach((tab) => {
    var tabHostname = new URL(tab.url).hostname;
    if (check_permissions_for_url(permissionsArray, tabHostname) == true) {
      console.log("going into => " + tab.url)
      
      execute_scripts(tab.id)
        .then()
        .catch(handle_missing_hosts_error);

    }
  });

}

async function handle_tab_event(tab){

  var tabHostname = new URL(tab.url).hostname;

  var permissionsArray = await browser.permissions.getAll().then((r) => r.origins);

  check_permissions_for_url(permissionsArray, tabHostname);
}

function check_permissions_for_url(permissions, tabHostname) {

  if(tabHostname == ""){
    return false;
  }

  for (let i = 0; i < permissions.length; i++) {
    if (permissions[i].includes(tabHostname)) {
      return true;
    }
  }
  permissions.forEach((permissionUrl) => {
    
  });
  return false;
}

function handle_missing_hosts_error(err) {
  if (err.message != "Missing host permission for the tab or frames") {
    onError(err);
  }
}

function onError(error) {
  console.error(`Error: ${error.message}`);
}

initial_run().then().catch(onError);
