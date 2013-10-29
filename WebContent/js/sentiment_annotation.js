var annotations = {};
var current_sentence_idx = -1;
var sentence_count = 0;
var node_count = 1;
var current_target = -1;
var current_source = -1;
var current_connection = null;
var text = [];
var rclick = null;

window.Sentiment = {
	add_word : function(to_add, wid) {
		jQuery('<span/>', {
			class: 'word window',
			id: 'word_' + wid,
			text: to_add
		}).appendTo($("#sentence"));
	},
	word_update : function () {
	    var sentence_div = $("#sentence");
	    $("#counter")[0].innerHTML = current_sentence_idx+1 + " of " + sentence_count; $("#counter")[0].innerText = current_sentence_idx+1 + " of " + sentence_count;
	    // remove old words
	    sentence_div.empty();
	    var idx = 0;
	    jQuery.each(text[current_sentence_idx], function() {
		window.Sentiment.add_word(this, idx);
		++idx;
	    });
	},
	next_sentence : function () {
	    if (current_sentence_idx < sentence_count-1) {
		++current_sentence_idx;
	    	window.Sentiment.word_update();
		console.log(current_sentence_idx);
		console.log(sentence_count);
	    }
	},
	previous_sentence : function () {
	    if (current_sentence_idx > 0) {
	    	--current_sentence_idx;
	    	window.Sentiment.word_update();
	    }
	},
	save : function () {
		console.log("save pressed");
		$.post('GraPAT', "some text", function(data) {
			console.log(data);
		});
	},
	logout : function() {
	    console.log("log out pressed");
	},

	read_input_file : function () {

		jQuery.get('sentences.txt', function(data) {
		    var all_sentences = data.split("\n");
		    var sentence_idx = 0;
		    jQuery.each(all_sentences, function() {
				var current_sentence = this;
				if (current_sentence == "") 
					return false;
				
				text.push([]);
				++sentence_count;
				var words = current_sentence.split(" ");
				jQuery.each(words, function() {
					text[sentence_idx].push(this);
				});
				++sentence_idx;
			});
			window.Sentiment.next_sentence();
		});
	},

        update : function () {
            // list of possible anchor locations for the blue source element
            var sourceAnchors = [
                [ 0, 1, 0, 1 ],
                [ 0.25, 1, 0, 1 ],
                [ 0.5, 1, 0, 1 ],
                [ 0.75, 1, 0, 1 ],
                [ 1, 1, 0, 1 ],
		"TopCenter", "RightMiddle", "LeftMiddle"              
            ];
           
            jsPlumb.importDefaults({
                // set default anchors.  the 'connect' calls below will pick these up, and in fact setting these means
                // that you also do not need to supply anchor definitions to the makeSource or makeTarget functions. 
                Anchors : [ sourceAnchors ],
                // drag options
                DragOptions : { cursor: "pointer", zIndex:2000 },
                // default to blue at source and green at target
                EndpointStyles : [{ fillStyle:"black" }, { fillStyle:"#black" }],
                // blue endpoints 7 px; green endpoints 11.
                Endpoints : [ ["Dot", { radius:2 } ], [ "Dot", { radius:2 } ] ],
                // default to a gradient stroke from blue to green.  for IE provide all green fallback.
                PaintStyle : {
                    //gradient:{ stops:[ [ 0, "black" ], [ 1, "black" ] ] },
                    strokeStyle: "black",
                    lineWidth:1.5
                },
		hoverPaintStyle: {
		    strokeStyle: "black",
		    lineWidth: 5
		},
            });

	    var red = "#680707";
	    var green = "#1D6807";
	    jsPlumb.registerConnectionTypes({
		"default": {
			paintStyle: {strokeStyle:"black", lineWidth: 1.5 },
			hoverPaintStyle: {strokeStyle: "black", lineWidth: 4},
			//overlays: [ ["Label", {label: "default", id: "label", cssClass: "edge_label node" }] ]
			},
		"positive": {
			paintStyle: {strokeStyle: green, lineWidth: 3.5},
			hoverPaintStyle: {strokeStyle: green, lineWidth: 5},
			//overlays: [ ["Label", {label: "", id: "label", cssClass: "test" }] ]
			},
		"negative": {
			paintStyle: {strokeStyle: red, lineWidth: 3.5}, 
			hoverPaintStyle: {strokeStyle: red, lineWidth: 5},
			//overlays: [ ["Label", {label: "", id: "label", cssClass: "test" }] ]
			}
		});

            var ent_endpoints = {
		anchor: ["TopCenter", "BottomCenter", "RightMiddle", "LeftMiddle"],
		endpoint: ["Dot", {radius: 5}],
		isSource: true,
		/*connectorOverlays: [
			[ "Arrow", {width:2, length: 3, location: 0.9, id: "arrow"} ]
		],*/
		paintStyle: {
			gradient: { stops: [ [ 0, "#004F66" ], [1, "#004F66"] ] },
			strokeStyle: "black",
			fillStyle: "#004F66",
			lineWidth: 1.5
		}
	    };
            //var allNodes = $(".node");
            $(".node").each( function(index) {
                jsPlumb.makeTarget($(this), {
                    anchor: "Continuous" //sourceAnchors,
                });
            });
	    $(".target").each( function(index) {
		jsPlumb.makeTarget($(this), {
		    anchor: "Continuous"
		});
	    });

            var allMovables = $(".movable");            
            // make them draggable
            jsPlumb.draggable(allMovables);
            
            var wordDivs = $(".word");
            jsPlumb.makeSource(wordDivs, {
                anchor: ["TopCenter"],
		endpoint: ["Dot", {radius: 0}],
		paintStyle: {
			lineWidth: 0
		}
            }); 
            jsPlumb.bind("connection", function(i,c) { 
		if (i.connection.source.nodeName != 'SPAN')
			i.connection.toggleType('default');
		if (i.connection.source.nodeName == 'SPAN' && (i.connection.target.innerText == 'new node' || i.connection.target.innerHTML == 'new node')) {
			i.connection.target.innerHTML = i.connection.source.innerHTML;
			i.connection.target.innerText = i.connection.source.innerText;
		}
		if (i.connection.source.nodeName == 'SPAN' && i.connection.target.innerHTML.indexOf(i.connection.source.innerHTML) < 0) {
			i.connection.target.innerHTML += ";" + i.connection.source.innerHTML;
		}
		// the connection and if not already there, the connected nodes have to be added to the internal model
            }); 
	    /*jsPlumb.bind("dblclick", function(c) {
		if (c.source.nodeName == "SPAN")
			return false;
		console.log(c);
		current_source = c.source.attributes.node_id.nodeValue;
		current_target = c.target.attributes.node_id.nodeValue;
		current_connection = c;
		$('#labelPopUp').show();
		return false;
	    });*/
	    jsPlumb.bind("ready", function () {
		jsPlumb.addEndpoint($(".node"), ent_endpoints);
		    });
        },
	labelPopUpButton_click : function () {
		var polarity = $('input[name="polarity"]:checked').val();
		var text_anchor = $('textarea#text_anchor_input').val();
		console.log('adding connection from ' + current_source + ' to ' + current_target + ' with polarity ' + polarity + ' and text anchor "' + text_anchor);

		if (polarity == 'negative') {
			current_connection.toggleType('negative');
		}
		else if (polarity == 'positive') {
			current_connection.toggleType('positive');
		}
		$('#labelPopUp').hide();
		current_connection.addOverlay(["Custom", { create: function(component) {
								return $('<div node_id="node_' + node_count + '" class="edge_label target">'+text_anchor+'</div>');
							},
							location: 0.5,
							cssClass: "edge_label target",
							id: "labelNode"					//(["Label", {label: text_anchor, id: "label", cssClass: "edge_label target"}]);
							}]);
		++node_count;
		window.Sentiment.update();
	},
        
        init : function() {         
            $('#rmenu').hide();
	    $('#labelPopUp').hide();
            
            window.Sentiment.update();

            // make 'window1' a connection source. notice the filter parameter: it tells jsPlumb to ignore drags
            // that started on the 'enable/disable' link on the blue window.
            //jsPlumb.makeTarget("window1", {
            //    anchor:sourceAnchors,     // you could supply this if yoddu want, but it was set in the defaults above.                         
            //    filter:function(evt, el) {
            //        var t = evt.target || evt.srcElement;
            //        return t.tagName !== "A";
            //    }
            //});
            //jsPlumb.makeTarget("window2", {});   
            //jsPlumb.makeSource("window2", {});
                

            // get the list of ".smallWindow" elements.            
//             var smallWindows = $(".word");
//             
//             // configure them as targets.
//             jsPlumb.makeSource(smallWindows, {
//                 anchor: sourceAnchors,               // you could supply this if you want, but it was set in the defaults above.                 
//                 //dropOptions:{ hoverClass:"hover" }
//             }); 

            // and finally connect a couple of small windows, just so its obvious what's going on when this demo loads.           
            //jsPlumb.connect({ source:"window1", target:"window5" });
            //jsPlumb.connect({ source:"window1", target:"window2" });
            //jsPlumb.connect({ source:"window1", target:"window3" });

            // click listener for the enable/disable link.
            //$("#enableDisableSource").bind("click", function() {
            //    var state = jsPlumb.toggleSourceEnabled("window1");
            //    $(this).html(state ? "disable" : "enable");
            //});
            $("#psentence_button")[0].value = "â†�\nprevious\nâ†�";
	    $("#psentence_button").css({
			float: "left"
		});
	    $("#nsentence_button")[0].value = "â†’\nnext\nâ†’"; 
	    $("#nsentence_button").css({
			float: "right"
		});
            $("#graph_part").bind("contextmenu", function(e) {
		    rclick = e;
		    console.log(e);
                    $('#rmenu').css({
                        top: e.pageY + 'px',
                        left: e.pageX + 'px'
                    }).show();
                    return false;
            });

            $("#add_ent").bind("click", function() {
		var x = rclick.pageX;
		var y = rclick.pageY;
		console.log(rclick);
                jQuery('<div/>', {
                    class: 'window movable invisible',
		    id: 'node_' + node_count,
		    node_id: node_count,
                    text: 'new node'
                }).appendTo('#graph_part');
		$("#node_"+node_count).css({
		    top: y + 'px',
		    left: x + 'px',
		    visibility: 'visible'
		});
		$("#node_"+node_count).fadeIn(2000);
		$("#node_"+node_count).addClass('node');
		++node_count;
                window.Sentiment.update();
            });
            
            $("#del_ele").bind("click", function(e) {
		jsPlumb.removeAllEndpoints(rclick.target);
		jsPlumb.detachAllConnections(rclick.target);
		rclick.target.remove();
            });            



            var ent_endpoints = {
                anchor: ["TopCenter", "BottomCenter", "RightMiddle", "LeftMiddle"],
                endpoint: ["Dot", {radius: 5}],
                isSource: true,
                /*connectorOverlays: [
                        [ "Arrow", {width:2, length: 3, location: 0.9, id: "arrow"} ]
                ],*/
                paintStyle: {
                        gradient: { stops: [ [ 0, "#004F66" ], [1, "#004F66"] ] },
                        strokeStyle: "black",
                        fillStyle: "#004F66",
                        lineWidth: 1.5
                }
            };


            jsPlumb.bind("dblclick", function(c) {
                if (c.source.nodeName == "SPAN")
                        return false;
                console.log(c);
                current_source = c.source.attributes.node_id.nodeValue;
                current_target = c.target.attributes.node_id.nodeValue;
                current_connection = c;
                $('#labelPopUp').show();
                return false;
            });
            jsPlumb.bind("ready", function () {
                jsPlumb.addEndpoint($(".node"), ent_endpoints);
            });


	    window.Sentiment.read_input_file();

            $('#rmenu').click(function() {
                $('#rmenu').hide();
            });
            $(document).click(function() {
                $('#rmenu').hide();
            });
	    $(window).resize( function() {
		console.log("resizing");
		$('.popUpContent').css({
		    position: 'absolute',
		    left: ($(window).width() - $('.popUpContent').width())/2,
		    top: ($(window).height() - $('.popUpContent').height())/2
		});
	    });
	    $(document).ready( function() {
		console.log('document ready');
		$(window).resize();
		window.Sentiment.update();
	    });
        }

	};
