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
				requestData(professorQuery, numElem, appendData);
	 		});

		}
	});
}

function appendData(elem, coursesData) {
	//TODO: Create function that appends data returned from API into HTML of page
}

//Makes AJAX request to API to collect evaluations data 
//appends data to page utilizing passed in element and callback function
function requestData(query, elem, callback) {
	chrome.runtime.sendMessage({"action": "getCoursesData", "coursesQuery": query}, (data) => {
		callback(elem, data);
	});
}



