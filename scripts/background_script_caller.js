//  ██████╗  █████╗  ██████╗██╗  ██╗ ██████╗ ██████╗  ██████╗ ██╗   ██╗███╗   ██╗██████╗         ███████╗ ██████╗██████╗ ██╗██████╗ ████████╗
//  ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔════╝ ██╔══██╗██╔═══██╗██║   ██║████╗  ██║██╔══██╗        ██╔════╝██╔════╝██╔══██╗██║██╔══██╗╚══██╔══╝
//  ██████╔╝███████║██║     █████╔╝ ██║  ███╗██████╔╝██║   ██║██║   ██║██╔██╗ ██║██║  ██║        ███████╗██║     ██████╔╝██║██████╔╝   ██║   
//  ██╔══██╗██╔══██║██║     ██╔═██╗ ██║   ██║██╔══██╗██║   ██║██║   ██║██║╚██╗██║██║  ██║        ╚════██║██║     ██╔══██╗██║██╔═══╝    ██║   
//  ██████╔╝██║  ██║╚██████╗██║  ██╗╚██████╔╝██║  ██║╚██████╔╝╚██████╔╝██║ ╚████║██████╔╝███████╗███████║╚██████╗██║  ██║██║██║        ██║   
//  ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚═════╝ ╚══════╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝   
//                                                                                                                                           

//
//			Listen for tab changes
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

//
//			When you switch tabs this will detect if it is one of the configured domains,
//			then it will retreive the shortcode from the browser storage and
//			send it to the tab as a message.
//

async function send_shortcode_message(tabId) {

  const tab = await browser.tabs
    .get(tabId)
    .then()
    .catch(onError);

  console.log("Sending message to tab " + tabId);

  const stored_shortcode = await browser.storage.local
    .get("stored_shortCode")
    .then((result) => {
      return result.stored_shortCode;
    })
    .catch(onError);

  await browser.tabs.sendMessage(tabId, { key: "copiedShortcode", value: stored_shortcode })
    .then(console.log("Succesfully sent message to ".concat(tab.url)))
    .catch(onError);
  
  await browser.tabs.sendMessage(tabId, { key: "setListeners", value: ""})
  .then(console.log("Succesfully sent setListeners message to ".concat(tab.url)))
  .catch(onError);
}

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

  await send_shortcode_message(tabId);
}

async function initial_run() {

  const permissionsArray = await browser.permissions.getAll().then((r) => r.origins);

  const tabs = await browser.tabs.query({});

  tabs.forEach((tab) => {
    var tabHostname = new URL(tab.url).hostname;
    if (check_permissions_for_url(permissionsArray, tabHostname) == true) {
      console.log("Interacting with => " + tab.url);
      
      execute_scripts(tab.id)
        .then()
        .catch(handle_missing_hosts_error);

    }
  });

}

async function get_tab_url(tabId){
  const tabs = await browser.tabs.query({});

  for (let i = 0; i < tabs.length; i++) {
    if (tabs[i].id == tabId) {
      return new URL(tabs[i].url).hostname;
    }
  }
  return "";
}

async function handle_tab_event(tabId, changeInfo, tab){
  
  if(changeInfo.status == "complete"){
    execute_scripts(tabId)
      .then()
      .catch(handle_missing_hosts_error);
  }
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

function handle_missing_hosts_error(err) {
  if (err.message != "Missing host permission for the tab or frames") {
    onError(err);
  }
}

function onError(error) {
  console.error(`Error: ${error.message}`);
}

initial_run().then().catch(onError);
