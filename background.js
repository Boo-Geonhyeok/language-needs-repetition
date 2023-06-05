chrome.webNavigation.onHistoryStateUpdated.addListener((details)=>{
    const url = new URL(details.url);
    if (url.href.startsWith('https://www.youtube.com/watch?')){
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {url: details.url});
      });
    }
  })