chrome.runtime.onMessage.addListener((request, sender, callback) => {
	if (request.action == "getTabURL") {
		chrome.tabs.query( {currentWindow: true, active: true}, (tabs) => {
			callback(tabs[0].url);
		});
	}

	return true; //to make listener asynchronous
});