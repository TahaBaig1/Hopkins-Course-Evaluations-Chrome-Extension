$("document").ready( () => {
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

		}
	});
}

//appends course eval data onto the HTML of the page
function appendData(elem, coursesData) {
	var avgRating = getAverageRating(coursesData);
	if (avgRating != -1) {
		var $rating = $("<span class = 'rating'> Rating: " + avgRating.toFixed(2) + "</span>");
		$(elem).append($rating);
	}
}

//Makes AJAX request to API to collect evaluations data 
//appends data to page utilizing passed in element and callback function
function requestData(query, elem, callback) {
	chrome.runtime.sendMessage({"action": "getCoursesData", "coursesQuery": query}, (data) => {
		callback(elem, data);
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



