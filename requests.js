chrome.runtime.onMessage.addListener((request, sender, callback) => {
	if (request.action == "getTabURL") {
		chrome.tabs.query( {currentWindow: true, active: true}, (tabs) => {
			callback(tabs[0].url);
		});
	} else if (request.action == "getCoursesData") {
		//gets JSON data of course evaluations via request to API
		var params = $.param(request.coursesQuery)
		var requestURL = "https://jhu-course-evaluations.herokuapp.com/courses?" + params;
		console.log(requestURL);
		
		$.ajax({
			url: requestURL,
			dataType: "json"
		}).done( (data) => {
			callback(data);
		});
	}

	return true; //to make listener asynchronous
});