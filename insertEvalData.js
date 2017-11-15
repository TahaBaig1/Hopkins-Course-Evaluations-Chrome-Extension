$("document").ready(() => {
	insertEvalData();
});

function insertEvalData() {
	//determine URL of course selection site before appending data
	chrome.runtime.sendMessage({"action": "getTabURL"}, (url) => {
		if (url.startsWith("https://sis.jhu.edu/sswf/SSS/SearchForClasses/SSS_ClassResults.aspx")) {
			//find location of course number and instructor column on course selection table
			var numCol = -1;
			var profCol = -1;

			var count = 0;
			$("#results .header td").each(function() {
				if (this.innerText == "Class #") {
					numCol = count;
				} else if (this.innerText == "Instructor(s)") {
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
				
				//appending data in courses column
				var numElem = $cols.get(numCol);
				var numberQuery = { "number": numElem.innerText };
				requestData(numberQuery, numElem, appendData);

				//appending data in professors column
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

	//adding popup of summaries of student comments
	createSummariesPopup(elem, coursesData);
}

//Makes AJAX request to API to collect evaluations data 
//appends data to page utilizing passed in element and callback function
function requestData(query, elem, callback) {
	chrome.runtime.sendMessage({"action": "getCoursesData", "coursesQuery": query}, (data) => {
		callback(elem, data);
	});
}

function createSummariesPopup(elem, coursesData) {
	if (coursesData.length == 0) return;

	//TODO: Implement for all semesters in courseData
	//make data say 'N/A' if it is not present

	$(elem).addClass("popup-wrapper");

	$popupData = $("<div class = 'popupdata'> </div>");
	$popupData.append("<div class = 'course-data-container'>" + 
					  	"<span> Semester: " + coursesData[0].semester + "</span>" +
					  	"<span> Rating: " + coursesData[0].rating + "</span>" +
					  	"<span> Professor(s): " + coursesData[0].professor + "</span>" +
					  "</div>");
	$popupData.append("<p> " + $.trim(coursesData[0].summary) + " </p>");
	$popupData.append("<div class = 'arrow right'> </div>");
	$popupData.append("<div class = 'arrow left'> </div>");

	$(elem).append($popupData);

	$(elem).on("mouseenter", function() {
		$(this).children(".popupdata").css("visibility", "visible");
	});

	$(elem).on("mouseleave", function() {
		$(this).children(".popupdata").css("visibility", "hidden");
	});
}

function getAverageRating(coursesData) {
	var sum = 0;
	var count = 0;

	for (var i = 0; i < coursesData.length; i++)  {
		if (coursesData[i].hasOwnProperty("rating") && !isNaN( parseFloat(coursesData[i].rating) ) ) {
			sum += coursesData[i].rating;
			count++;
		}
	}

	if (count == 0) return -1; //indicates course has no ratings so far
	return sum / count;
}



