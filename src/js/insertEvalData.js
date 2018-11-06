$("document").ready(() => {
	insertEvalData();
});

function insertEvalData() {
	//determine URL of course selection site before appending data
	chrome.runtime.sendMessage({"action": "getTabURL"}, (url) => {
		if (url.includes("SearchForClasses")) {
			//find location of course number and instructor column on course selection table
			var numCol = -1;
			var profCol = -1;

			var count = 0;
			$("#results .header td").each(function() {
				var trimText = this.innerText.trim();
				if (trimText == "Class #") {
					numCol = count;
				} else if (trimText == "Instructor(s)") {
					profCol = count;
				}

				if (numCol != -1 && profCol != -1) return false; //break out of loop
				else							   count++;
			});

			//if locations are not found, then there is no where to insert data, exit
			if (numCol == -1 || profCol == -1) return;
			//appending data 
			$("#results .odd").add(".even").each(function() {
				var $cols = $(this).children("td");
				
				//appending data in courses column: ratings and comments for course for each semester taught
				var numElem = $cols.get(numCol);
				var numberQuery = { "number": numElem.innerText };
				requestData(numberQuery, numElem, appendData);

				//appending data in professors column: ratings and comments for course for each semester taught by professor
				var profElem = $cols.get(profCol);
				var professorQuery = { "number": numElem.innerText, "professor": profElem.innerText };
				requestData(professorQuery, profElem, appendData);
	 		});

		};
	});
}

//appends course eval data onto the HTML of the page
function appendData(elem, coursesData) {
	
	//adding average course ratings
	var avgRating = getAverageRating(coursesData);
	if (avgRating != -1) {
		var $rating = $("<span class = 'rating'> Rating: " + avgRating.toFixed(2) + "</span>");
		$(elem).append($rating);
	}

	//adding popup including summaries of student comments alongisde ratings for each semester course was taught
	createSummariesPopup(elem, coursesData);
}

//Makes AJAX request to API to collect evaluations data 
//appends data to page utilizing passed in element and callback function
function requestData(query, elem, callback) {
	//sending message to event page to carry out AJAX request and send back recieved data
	chrome.runtime.sendMessage({"action": "getCoursesData", "coursesQuery": query}, (data) => {
		callback(elem, data);
	});
}

function createSummariesPopup(elem, coursesData) {
	var length = coursesData.length;
	if (length == 0) return;

	$(elem).addClass("popup-wrapper");

	if (length == 1) {
		//do not include arrrows
		var $popupData = setUpPopupData(coursesData[0]);
		$(elem).append($popupData);
	} else {
		//append all course data popups to page, one for each semester's course returned from API, (all intially hidden)
		for (var i = 0; i < length; i++) {
			$popupData = setUpPopupData(coursesData[i]);
			$popupData.append("<div class = 'arrow right'> </div>");
			$popupData.append("<div class = 'arrow left'> </div>");

			$(elem).append($popupData);
		}
	}

	//add event listeners
	$(elem).on("mouseenter", function() {
		var $popupData = $(this).children(".popupdata");
		$popupData.first().css("visibility", "visible");
		var length = $popupData.length;

		var curr = 0;

		//adding slider functionality
		$popupData.find(".right").on("click", function() {
			$popupData.eq(curr).css("visibility", "hidden");
			curr = (curr + 1) % length;
			$popupData.eq(curr).css("visibility", "visible");			
		});

		$popupData.find(".left").on("click", function() {
			$popupData.eq(curr).css("visibility", "hidden");
			curr = curr - 1 >= 0 ? curr - 1 : length - 1;
			$popupData.eq(curr).css("visibility", "visible");			
		});

	});

	$(elem).on("mouseleave", function() {
		$(this).children(".popupdata").css("visibility", "hidden");
		$(this).find(".arrow").off();
	});
}

function setUpPopupData(courseData) {
	var semester = courseData.hasOwnProperty("semester")   ? courseData.semester : "N/A";
	var rating = courseData.hasOwnProperty("rating")
				 && isFloat(courseData.rating)             ? courseData.rating : "N/A";
	var professor = courseData.hasOwnProperty("professor") ? courseData.professor : "N/A";
	var summary = courseData.hasOwnProperty("summary")     ? courseData.summary : "N/A";

	var $popupData = $("<div class = 'popupdata'> </div>");
	$popupData.append("<div class = 'course-data-container'>" + 
					  	"<span> Semester: " + semester + "</span>" +
					  	"<span> Rating: " + rating + "</span>" +
					  	"<span> Professor(s): " + professor + "</span>" +
					  "</div>");
	$popupData.append("<p> " + $.trim(summary) + " </p>");
	return $popupData;
}

function getAverageRating(coursesData) {
	var sum = 0;
	var count = 0;

	var length = coursesData.length;
	for (var i = 0; i < length; i++)  {
		if (coursesData[i].hasOwnProperty("rating") && isFloat(coursesData[i].rating)) {
			sum += coursesData[i].rating;
			count++;
		}
	}

	if (count == 0) return -1; //indicates course has no ratings so far
	return sum / count;
}

function isFloat(string) {
	return !isNaN(parseFloat(string));
}
