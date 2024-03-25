if (document.addEventListener) {
    document.addEventListener('contextmenu', function(e) {
        alertSelection(); //here you draw your own menu
        e.preventDefault();
    }, false);
} else {
    document.attachEvent('oncontextmenu', function() {
        alertSelection(); //here you draw your own menu
        window.event.returnValue = false;
    });
}

// http://stackoverflow.com/questions/7991474/calculate-position-of-selected-text-javascript-jquery
function getSelectionCharOffsetsWithin(element) {
    var start = 0, end = 0;
    var sel, range, priorRange;
    if (typeof window.getSelection != "undefined") {
        range = window.getSelection().getRangeAt(0);
        priorRange = range.cloneRange();
        priorRange.selectNodeContents(element);
        priorRange.setEnd(range.startContainer, range.startOffset);
        start = priorRange.toString().length;
        end = start + range.toString().length;
    } else if (typeof document.selection != "undefined" &&
            (sel = document.selection).type != "Control") {
        range = sel.createRange();
        priorRange = document.body.createTextRange();
        priorRange.moveToElementText(element);
        priorRange.setEndPoint("EndToStart", range);
        start = priorRange.text.length;
        end = start + range.text.length;
    }
    return {
        start: start,
        end: end
    };
}

function alertSelection() {
    var mainDiv = document.getElementById("article_content");
    var sel = getSelectionCharOffsetsWithin(mainDiv);
    var result_element = document.getElementById("result");
    result_element.innerHTML = "selection beginning at: " + sel.start.toString() + " and ending at: " + sel.end.toString();
}