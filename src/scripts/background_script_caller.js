//  ██████╗  █████╗  ██████╗██╗  ██╗ ██████╗ ██████╗  ██████╗ ██╗   ██╗███╗   ██╗██████╗         ███████╗ ██████╗██████╗ ██╗██████╗ ████████╗
//  ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔════╝ ██╔══██╗██╔═══██╗██║   ██║████╗  ██║██╔══██╗        ██╔════╝██╔════╝██╔══██╗██║██╔══██╗╚══██╔══╝
//  ██████╔╝███████║██║     █████╔╝ ██║  ███╗██████╔╝██║   ██║██║   ██║██╔██╗ ██║██║  ██║        ███████╗██║     ██████╔╝██║██████╔╝   ██║   
//  ██╔══██╗██╔══██║██║     ██╔═██╗ ██║   ██║██╔══██╗██║   ██║██║   ██║██║╚██╗██║██║  ██║        ╚════██║██║     ██╔══██╗██║██╔═══╝    ██║   
//  ██████╔╝██║  ██║╚██████╗██║  ██╗╚██████╔╝██║  ██║╚██████╔╝╚██████╔╝██║ ╚████║██████╔╝███████╗███████║╚██████╗██║  ██║██║██║        ██║   
//  ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚═════╝ ╚══════╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝   
//                                                                                                                                           

//
// Functions for checking permissions for sending messages to pages.
// This is technically not needed, but it avoids sending messages to tabs who wont listen.
//

let permissionsArray = await browser.permissions.getAll().then((r) => r.origins);

async function updatePermissions(){
  permissionsArray = await browser.permissions.getAll().then((r) => r.origins);
}

if(browser.permissions.onAdded.hasListener(updatePermissions) == false){
  browser.permissions.onAdded.addListener(updatePermissions)
}

function check_permissions_for_url(tabUrl) {
  var url = new URL(tabUrl);
  
  if(tabUrl == "" | typeof tabUrl == "undefined" | url.pathname.endsWith(".pdf")){
    return false;
  }

  if (permissionsArray.includes("*://"+url.hostname+"/*")) {
    return true;
  }
  
  return false;
}

//
//
// Listen for when a tab finishes loading and send all the scripts to the tab.
//
//

// Filter for tab changes, we only want the tab status.

async function get_filter(){
  const filter = {
    urls: permissionsArray,
    properties: ["status"],
  };
  return filter;
}

// Listen for status changes.

if(browser.tabs.onUpdated.hasListener(tab_status_change, await get_filter()) == false){
  browser.tabs.onUpdated.addListener(tab_status_change, await get_filter());
}

// When tab status is complete, done loading all assets, send scripts and messages to tab.

async function tab_status_change(tabId, changeInfo, tab){
  if(changeInfo.status == "complete"){
    console.log("Tab finished loading " + tab.url);
    await execute_all_scripts(tabId);
  }
}

// Send scripts to tab, as well as messages.

async function execute_all_scripts(tabId) {

  await browser.scripting.executeScript({
    target: {
      tabId: tabId,
    },
    files: ["scripts/jquery-3.7.1.min.js"],
  });

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

  // Send messages with shortcode and message with setListeners command.
  send_shortcodes_to_tab(tabId);
  send_set_listeners_message(tabId);
}

//
// Listen for tab changes to send stored shortcode into tab.
//

if(browser.tabs.onActivated.hasListener(on_tab_activated) == false){
  browser.tabs.onActivated.addListener(on_tab_activated);
}

async function on_tab_activated(activeInfo){
  if(typeof activeInfo.tabId != "undefined"){
    const tab = await browser.tabs
      .get(activeInfo.tabId)
    if (check_permissions_for_url(tab.url) == true) {
      console.log("Tab activated " + tab.url)
      send_shortcodes_to_tab(activeInfo.tabId);
      // Set listeners on tab activation just in case there are new copy buttons in the page.
      // This should ideally be set to listen for any new copy buttons and then add the listener there.
      send_set_listeners_message(activeInfo.tabId);
    }
  }
}

//
// Functions that send messages to tab.
//

async function send_shortcodes_to_tab(tabId){
  // Send stored shortcodes to tab, so tab can set them into local storage.
  const stored_shortcode = await browser.storage.local
    .get("stored_shortCode")
      .then((result) => {
        return result.stored_shortCode;
    })
  
  if(typeof stored_shortcode != undefined | stored_shortcode != null)
  {
    const tab = await browser.tabs
      .get(tabId)

    browser.tabs.sendMessage(tabId, { key: "copiedShortcode", value: stored_shortcode })
      .then((r)=>{if(r.response == "GOOD"){console.log("Sucesfully sent shortcode message to tab " + tab.url);}}, onError)
  }
}

async function send_set_listeners_message(tabId){
  const tab = await browser.tabs
    .get(tabId)
  // Send setListeners message to add listeners to WPBakery copy btns.
  let k = await browser.tabs.sendMessage(tabId, { key: "setListeners", value: ""})
    .then((r)=>{if(r.response == "GOOD"){console.log("Sucesfully sent setListeners message to tab " + tab.url);}}, onError)
}

//
// Functions for initial run of addon. Makes sure all configured pages have the scripts ready.
//

async function initial_run() {
  const tabs = await browser.tabs.query({});

  await tabs.forEach((tab) => {
    if (check_permissions_for_url(tab.url) == true) {
      console.log("Allowed at " + tab.url);
       execute_all_scripts(tab.id);
    }
    else{
      console.log("Not allowed at " + tab.url);
    }
  });
}

// Run on all tabs, filter
initial_run()

//
// Listen for key command CTRL+SHIFT+F1 to open side bar
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