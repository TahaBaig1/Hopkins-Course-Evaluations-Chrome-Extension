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
		var $popupData = setUpPopupData(elem, coursesData[0]);
		$(elem).append($popupData);
	} else {
		//append all course data popups to page, one for each semester's course returned from API, (all intially hidden)

		//first course does not need left arrow
		$popupData = setUpPopupData(elem, coursesData[0]);
		$popupData.append("<div class = 'arrow right'> </div>");
		$(elem).append($popupData);

		for (var i = 1; i < length-1; i++) {
			$popupData = setUpPopupData(elem, coursesData[i]);
			$popupData.append("<div class = 'arrow right'> </div>");
			$popupData.append("<div class = 'arrow left'> </div>");

			$(elem).append($popupData);
		}

		//last course does need right arrow
		$popupData = setUpPopupData(elem, coursesData[length-1]);
		$popupData.append("<div class = 'arrow left'> </div>");
		$(elem).append($popupData);
	}

	//add event listeners
	$(elem).on("mouseenter", function() {
		var $popupData = $(this).children(".popupdata");
		$popupData.first().css("visibility", "visible");

		$popupData.find(".right").on("click", function() {
			var $course = $(this).parent();			
			var $next = $course.next();
			if ($next.length != 0) {
				$course.css("visibility", "hidden");
				$next.css("visibility", "visible");
			}
		});

		$popupData.find(".left").on("click", function() {
			var $course = $(this).parent();
			var $prev = $course.prev();
			if ($prev.length != 0) 	{
				$course.css("visibility", "hidden");				
				$prev.css("visibility", "visible");
			}
		});
	});

	$(elem).on("mouseleave", function() {
		$(this).children(".popupdata").css("visibility", "hidden");
		$(this).find(".arrow").off();
	});
}

function setUpPopupData(elem, courseData) {
	var semester = "N/A", rating = "N/A", professor= "N/A", summmary = "N/A";

	if (courseData.hasOwnProperty("semester")) {
		semester = courseData.semester;
	} 

	if (courseData.hasOwnProperty("rating") && isFloat(courseData.rating)) {
		rating = courseData.rating;
	}

	if (courseData.hasOwnProperty("professor")) {
		professor = courseData.professor;
	}

	if (courseData.hasOwnProperty("summary")) {
		summary = courseData.summary;
	}

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
