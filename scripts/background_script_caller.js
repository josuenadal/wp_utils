//  ██████╗  █████╗  ██████╗██╗  ██╗ ██████╗ ██████╗  ██████╗ ██╗   ██╗███╗   ██╗██████╗         ███████╗ ██████╗██████╗ ██╗██████╗ ████████╗
//  ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔════╝ ██╔══██╗██╔═══██╗██║   ██║████╗  ██║██╔══██╗        ██╔════╝██╔════╝██╔══██╗██║██╔══██╗╚══██╔══╝
//  ██████╔╝███████║██║     █████╔╝ ██║  ███╗██████╔╝██║   ██║██║   ██║██╔██╗ ██║██║  ██║        ███████╗██║     ██████╔╝██║██████╔╝   ██║   
//  ██╔══██╗██╔══██║██║     ██╔═██╗ ██║   ██║██╔══██╗██║   ██║██║   ██║██║╚██╗██║██║  ██║        ╚════██║██║     ██╔══██╗██║██╔═══╝    ██║   
//  ██████╔╝██║  ██║╚██████╗██║  ██╗╚██████╔╝██║  ██║╚██████╔╝╚██████╔╝██║ ╚████║██████╔╝███████╗███████║╚██████╗██║  ██║██║██║        ██║   
//  ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚═════╝ ╚══════╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝   
//                                                                                                                                           

//
// Listen for when a tab finishes loading
//

async function get_filter(){
  const permissionsArray = await browser.permissions.getAll().then((r) => r.origins);
  const filter = {
    urls: permissionsArray,
    properties: ["status"],
  };
  return filter;
}

if(browser.tabs.onUpdated.hasListener(handle_tab_event, await get_filter()) == false){
  browser.tabs.onUpdated.addListener(handle_tab_event, await get_filter());
}

// When tab finishes loading, send scripts and messages to tab.

async function handle_tab_event(tabId, changeInfo, tab){
  
  if(changeInfo.status == "complete"){
    await execute_scripts(tabId);
  }
}

// Send scripts to tab, as well as message containing any stored shortcode.
async function execute_scripts(tabId) {
  await browser.scripting.executeScript({
    target: {
      tabId: tabId,
    },
    files: ["scripts/shortcode/page_shortcode_handler.js"],
  });

  await browser.scripting.executeScript({
    target: {
      tabId: tabId,
    },
    files: ["scripts/paster/page_paster.js"],
  });

  // Send messages to perform actions on the tab.
  await send_addon_messages(tabId);
}

async function send_addon_messages(tabId) {

  const tab = await browser.tabs
    .get(tabId)
    .then()
    .catch(onError);

  console.log("Sending message to tab " + tabId);

  // Send stored shortcodes to tab, so tab can set them into local storage.
  const stored_shortcode = await browser.storage.local
    .get("stored_shortCode")
    .then((result) => {
      return result.stored_shortCode;
    })
    .catch(onError);
  
  if(typeof stored_shortcode != undefined | stored_shortcode != null)
  {
    await browser.tabs.sendMessage(tabId, { key: "copiedShortcode", value: stored_shortcode })
      .then(console.log("Succesfully sent message to ".concat(tab.url)))
      .catch(onError);
  }

  // Send setListeners message to add listeners to WPBakery copy btns.
  await browser.tabs.sendMessage(tabId, { key: "setListeners", value: ""})
  .then(console.log("Succesfully sent setListeners message to ".concat(tab.url)))
  .catch(onError);
}

// Functions for initial run of addon. Makes sure all configured pages have the scripts ready.

async function initial_run() {

  const permissionsArray = await browser.permissions.getAll().then((r) => r.origins);

  const tabs = await browser.tabs.query({});

  await tabs.forEach((tab) => {
    var tabHostname = new URL(tab.url).hostname;
    if (check_permissions_for_url(permissionsArray, tabHostname) == true) {
      console.log("Interacting with => " + tab.url);
      
      execute_scripts(tab.id);

    }
  });
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

  return false;
}

// Run
await initial_run()

//
// Listen for key command CTRL+SHIFT+F1
//

browser.commands.onCommand.addListener((command) => {
  if (command === "open_sidebar") {
    browser.sidebarAction.open()
    console.log("Opening sidebar!");
  }
});

// Misc Functions

function onError(error) {
  console.error(`Error: ${error.message}`);
}