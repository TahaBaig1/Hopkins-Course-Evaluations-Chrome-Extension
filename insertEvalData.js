$("document").ready( () => {
	insertEvalData();
});


function insertEvalData() {
	//determine URL of course selection site before appending data
	chrome.runtime.sendMessage( {"action": "getTabURL"}, (url) => {
		if (url.startsWith("https://sis.jhu.edu/sswf/SSS/SearchForClasses/SSS_ClassResults.aspx")) {
			//find location of course number and instructor column
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
				else									 count++;
			});

			//if columns are not found, then there is no where to insert data, exit
			if (numCol == -1 || profCol == -1) return;

			//appending data 
			$("#results .odd").add(".even").each(function() {
				var $cols = $(this).children("td");

				var numElem = $cols.get(numCol);
				var number = numElem.innerText;

				var profElem = $cols.get(profCol);
				var professor = profElem.innerText;

				console.log(number + " " + professor);
	 		});

		}
	});
}

