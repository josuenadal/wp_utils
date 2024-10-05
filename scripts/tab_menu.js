function open_in_left_env(url) {
  let new_url = url.replace(right_link, left_link);

  browser.tabs.create({
    url: new_url,
    index: 0,
  });
}

function open_in_right_env(url) {
  let new_url = url.replace(left_link, right_link);

  browser.tabs.create({
    url: new_url,
    index: 99999,
  });
}

async function get_highlighted_tab_ids() {
  return await browser.tabs.query({ currentWindow: true, highlighted: true }).then((tab) => {
    return tab.map((t) => {
      return t.id;
    });
  });
}

async function open_highlighted_tabs_in_opposite_env(url = null) {
  let highlighted_tab_ids = await get_highlighted_tab_ids();

  let highlighted_tabs_urls = await return_url_array_from_tabIds(highlighted_tab_ids);

  if (url != null) {
    if (!highlighted_tabs_urls.includes(url)) {
      highlighted_tabs_urls.push(url);
    }
  }

  highlighted_tabs_urls.forEach((url) => {
    if (url.includes(right_link)) {
      open_in_left_env(url);
    } else if (url.includes(left_link)) {
      open_in_right_env(url);
    }
  });
}

function add_Opp_menu() {
  browser.menus.create({
    id: "Open-Opp",
    title: "Open in Opposite",
    contexts: ["tab"],
  });
}

async function return_url_array_from_tabIds(tabIds_array) {
  let tabs = await Promise.all(
    tabIds_array.map(async (id) => {
      return await browser.tabs.get(id).then((tab) => {
        return tab;
      });
    })
  );

  let tabs_urls = tabs.map((tab) => {
    return tab.url;
  });

  return tabs_urls;
}

browser.menus.onClicked.addListener(open_Opp_Handler);

var left_link = "";
var right_link = "";

async function open_Opp_Handler(event) {
  left_link = await browser.storage.local.get("Left_Env_Link").then((result) => {
    return result.Left_Env_Link;
  });
  right_link = await browser.storage.local.get("Right_Env_Link").then((result) => {
    return result.Right_Env_Link;
  });

  if ((left_link == "undefined") | (right_link == "undefined")) {
    return onError;
  }

  if (event.menuItemId == "Open-Opp") {
    open_highlighted_tabs_in_opposite_env(event.pageUrl);
  }
}

function onError(error) {
  console.error(error)
}

add_Opp_menu();
