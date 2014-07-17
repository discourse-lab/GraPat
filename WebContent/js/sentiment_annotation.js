var annotations = {
		"nodes": {},
		"edges": {} 
};

var changed = false;

var current_sentence_idx = -1;
var edge_count = 0;
var sentence_count = 0;
var node_count = 1;
var current_target = null;
var current_source = null;
var current_connection = null;
var text = {};
var sentence_order = [];
var sentence_id_to_order = {};
var rclick = null;
var annotator_id = -1;

var annotation_bundle_id = null;
var annotation_type = null;

var add_to_node_text = false;
var alt_node_text = '';

window.XMLParser = {
		
},

window.Sentiment = {
	
	update_node_count : function() {
		// since we want the first unused number, we can ommit the -1 which had to be there due to the author node being counted
		return $('.target').length + $('.node').length ;
	},

	
	load_data : function(bundle_id, sentence_id, add_to_word_connections) {

		if (add_to_word_connections == null)
			add_to_word_connections = true;
		
		var sent_ord = sentence_id_to_order[sentence_id];
		if (sent_ord > 0) {
            $.when( window.Sentiment.load_data(bundle_id, sentence_order[sent_ord - 1], false) ).then( 
            		function() { 
            			return window.Sentiment._request_and_add(bundle_id, sentence_id, add_to_word_connections); 
        			});
		}
		else
			return window.Sentiment._request_and_add(bundle_id, sentence_id, add_to_word_connections);
	},

	
	_request_and_add : function(bundle_id, sentence_id, add_to_word_connections) {
		var req_data = {
				"bundle_id": bundle_id,
				"sentence_id": sentence_id
		};
		var delayed = [];
		var jreq = $.ajax({ type: 'GET', url: "Loader", data: req_data, dataType: "json", async: false, success: function(data) {
            var graph = jQuery.parseJSON( data.graph );
            var layout = jQuery.parseJSON( data.layout );
			
            var loaded_annotations = {
    				"nodes": {},
    				"edges": {} 
    		};
            
            if (add_to_word_connections) {
                if (graph != null)
                	loaded_annotations = graph;
            }
            
            
            if (graph != null) {
	            node_count = window.Sentiment.update_node_count() + 1;
				$.each(graph.nodes, function(key, value) {
					var x = layout[key]["x"];
					var y = layout[key]["y"];
					window.Sentiment.add_node(key, x, y, value);
				});
				
	            $.each(graph.edges, function(source_id, value) {
	                $.each(value, function(target_id, edges) {
	                    $.each(edges, function(conn_id, attrs) {
	                    	
	                        if ($('#' + target_id)[0] == null || $('#' + source_id)[0] == null) {
	                        	if (!add_to_word_connections && (source_id.indexOf("word_") == 0 || target_id.indexOf("word_") == 0)) {
	                        		
	                        	}
	                        	else
	                        		delayed.push([ source_id, target_id, attrs ]);
	                            // jquery continue
	                            return true;
	                        }
	                        if (!add_to_word_connections && (source_id.indexOf("word_") == 0 || target_id.indexOf("word_") == 0)) {
	                        }
	                        else {
		                        current_connection = jsPlumb.connect({source: source_id, target: target_id});
		                        current_source = current_connection.sourceId;
		                        current_target = current_connection.targetId;
		                        if (current_connection.source.nodeName != "SPAN") {
		                        	if (annotation_type == 'sentiment')
		                        		window.Sentiment.labelPopUpButton_click(attrs.label_node_id, attrs.polarity, attrs.text_anchor, attrs.context, attrs.world_knowledge, attrs.ironic, attrs.rhetoric);
		                        	else if (annotation_type == 'argumentation')
		                        		window.Sentiment.labelPopUpButton_click(attrs.label_node_id, null, null, null, null, null, null, attrs.c_type);
		                        }
	                    	}
	                    });
	                });
	            });
	            
	            var it_count = 0;
	            while (delayed.length > 0) {
	            	var entry = delayed.pop();
	                var source_id = entry[0];
	                var target_id = entry[1];
	                var attrs = entry[2];
	                ++it_count;
	                if ($('#' + target_id)[0] == null || $('#' + source_id)[0] == null) {
	                    delayed.push([ source_id, target_id, attrs ]);
	                    // js continue
	                    if (it_count < 1000)
	                    	continue;
	                    else
	                    	alert('Loading error. Your saved data is fine! Please just reload the sentence.');
	                }
	                
	                current_connection = jsPlumb.connect({source: source_id, target: target_id});
	                current_source = current_connection.sourceId;
	                current_target = current_connection.targetId;
	                if (current_connection.source.nodeName != "SPAN")
	                	window.Sentiment.labelPopUpButton_click(attrs.label_node_id, attrs.polarity, attrs.text_anchor, attrs.context, attrs.world_knowledge, attrs.ironic, attrs.rhetoric);
	                
	            
	            }
	            changed = false;
	    	 
	    		window.Sentiment.update();
            }
    		if (add_to_word_connections)
    			annotations = loaded_annotations;
            
		}});
		return jreq;
	},

	
	add_node : function(node_id, x, y, label, type) {
		if (type == null)
			type = 'default';
		if ($('#' + node_id).length == 0) {
		
			annotations.nodes[node_id] = "";
	        jQuery('<div/>', {
	            class: 'window movable invisible',
	            id: node_id,
	            node_id: node_count,
	            text: label
		    }).appendTo('#graph_part');
		            
			$("#"+node_id).css({
			    top: y ,
			    left: x ,
			    visibility: 'visible'
			});
			++node_count;
			$("#"+node_id).addClass("node");
			
			if (type == 'circle')
				$("#"+node_id).addClass("circle");
			
			window.Sentiment.update();
			changed = true;

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
            jsPlumb.addEndpoint($("#" + node_id), ent_endpoints);

		}
	},

	
	init_globals : function() {
		annotations = {
				"nodes": {},
				"edges": {}
		};
		current_sentence_idx = -1;
		edge_count = 0;
		sentence_count = 0;
		node_count = 1;
		current_target = null;
		current_source = null;
		current_connection = null;
		text = {};
		sentence_order = [];
		rclick = null;
		annotator_id = -1;
	},

	
	get_files_to_be_annotated : function() {
		$.getJSON( "ResourceHandler", function(data) {
			$.each(data, function(key, value) {
				$('#annot_file_select')
					.append($('<option>', {value : key})
					.text(value));
			});
		});
	},

	
	change_annot_file : function() {
		var flist = $("#annot_file_select")[0];
		//var key = flist.options[flist.selectedIndex].value;
		var value = flist.options[flist.selectedIndex].text;
		// console.log("file selection changed to " + key + ":" + value);
		
		window.Sentiment.read_input_file(value);
		window.Sentiment.update();
	},

	
	// trid: token range id
	add_word : function(to_add, wid, trid) {
		if ($('#word_' + wid).length == 0) {
			var word_type = "";
			if (annotation_type == 'sentiment')
				word_type = 'word_sent';
			else if (annotation_type == 'argumentation')
				word_type = 'word_arg';
			jQuery('<span/>', {
				class: word_type + ' window',
				id: 'word_' + wid,
				text: to_add,
				token_range_id: trid
			}).appendTo($("#sentence"));
			
	        var required_width = 0;
	        jQuery.each( $('.word_arg') , function() {
	                required_width += $(this).width() + parseInt($(this).css('margin-left')) + parseInt($(this).css('margin-right')) + parseInt($(this).css('padding-left')) + parseInt($(this).css('padding-right')) + parseInt($(this).css('border-width')) * 2;
	        });

	        jQuery.each( $('.word_sent') , function() {
	                required_width += $(this).width() + parseInt($(this).css('margin-left')) + parseInt($(this).css('margin-right')) + parseInt($(this).css('padding-left')) + parseInt($(this).css('padding-right')) + parseInt($(this).css('border-width')) * 2;
	        });

	        if (required_width > $( document ).width() ) {
	            $( 'body' ).css( 'width', $( document ).width() + $( '#word_' + wid ).width() + parseInt($( '#word_' + wid ).css('margin-left')) + parseInt($( '#word_' + wid ).css('margin-right')) + parseInt($('#word_' + wid).css('padding-left')) + parseInt($('#word_' + wid).css('padding-right')) + parseInt($('#word_' + wid).css('border-width')) * 2 + 'px');
	        }
	        else {
	            $( 'body' ).css( 'width', $(document).width() );
	        }
        }
    },
    
    
	word_update : function () {
	    var sentence_div = $("#sentence");
	    $("#counter")[0].innerHTML = current_sentence_idx+1 + " of " + sentence_count; $("#counter")[0].innerText = current_sentence_idx+1 + " of " + sentence_count;
	    // remove connections and anchor points to word divs
	    // TODO
	    // remove old words
	    sentence_div.empty();
	    
	    
	    var idx = 0;
	    jQuery.each(text[sentence_order[current_sentence_idx]], function() {
	    	window.Sentiment.add_word(this['token'], idx, this['trid']);
	    	++idx;
	    });
	},
	
	
	next_sentence : function (sa) {
		sa = (typeof sa === 'undefined') ? true : sa;
		
		if (sa && changed)
			window.Sentiment.save();
		
	    if (current_sentence_idx < sentence_count-1) {
			annotations = {
					"nodes": {},
					"edges": {} 
			};
	    	++current_sentence_idx;
	    	// resetting the width to avoid increasingly big left and right margins
	    	$( 'body' ).css('width', 100);
	    	window.Sentiment.word_update();
	    	window.Sentiment.clear();
	    	window.Sentiment.load_data(annotation_bundle_id, sentence_order[current_sentence_idx]);
	    }
	},
	
	
	previous_sentence : function () {
	    if (current_sentence_idx > 0) {
	    	--current_sentence_idx;
	    	window.Sentiment.word_update();
	    	window.Sentiment.clear();
			annotations = {
					"nodes": {},
					"edges": {} 
			};
	    	window.Sentiment.load_data(annotation_bundle_id, sentence_order[current_sentence_idx]);
	    }
	},
	
	
	clear : function () {
		jsPlumb.detachEveryConnection();
		jsPlumb.deleteEveryEndpoint();
		
		$('.node').remove();
	},
	
	
	save : function () {
		if (!changed)
			return;
		// node_id -> x,y coordinates
		var layout = {};
		var nodes = $(".node");
		$.each(nodes, function() {
			if (!($(this)[0].id in layout))
				layout[ $(this)[0].id ] = {};
			layout[$(this)[0].id]["x"] = $(this).css("left");
			layout[$(this)[0].id]["y"] = $(this).css("top");
		});
		
		$.post('GraPAT', {	"annotation_bundle": annotation_bundle_id, 
							"sentence": sentence_order[current_sentence_idx], 
							"layout": JSON.stringify(layout),
							"graph": JSON.stringify(annotations), 
							"annotator": JSON.stringify({ "id": annotator_id })
							}, 
							
							function(data) {
			$("#saved").hide().fadeIn(1500);
			$("#saved").fadeOut(2500);
		});
		changed = false;
	},
	
	
	logout : function() {
	},
	

	init_arg : function () {
		// to add
		// 
		jQuery('<div/>', {
            class: 'rmenu_element',
            id: 'add_circle_ent',
            text: 'add proponent'
	    }).appendTo('#rmenu');
		jQuery('<div/>', {
            class: 'rmenu_element',
            id: 'add_square_ent',
            text: 'add opponent'
	    }).appendTo('#rmenu');
		jQuery('<div/>', {
            class: 'rmenu_element',
            id: 'add_join_edus',
            text: 'add EDU join'
	    }).appendTo('#rmenu');
		jQuery('<div/>', {
            class: 'rmenu_element',
            id: 'del_ele',
            text: 'delete element'
	    }).appendTo('#rmenu');
		

	      $("#add_square_ent").bind("click", function() {
	      		var node_id = 'node_' + node_count;
				annotations.nodes[node_id] = "";
				window.Sentiment.add_node(node_id, rclick.pageX, rclick.pageY, 'new node');
	      });
	      $("#add_circle_ent").bind("click", function() {
	      		var node_id = 'node_' + node_count;
				annotations.nodes[node_id] = "";
				window.Sentiment.add_node(node_id, rclick.pageX, rclick.pageY, 'new node', 'circle');
	      });
	      $("#add_join_edus").bind("click", function() {
	      		var node_id = 'node_' + node_count;
				annotations.nodes[node_id] = "";
				window.Sentiment.add_node(node_id, rclick.pageX, rclick.pageY, '+', 'circle');
	      });
	      
	      add_to_node_text = false;
	      alt_node_text = 'ADU';
	      
	      $("#popUpTable_arg").show();
	      $("#popUpTable_sent").hide();

	},
	
	
	init_sent : function () {
	  jQuery('<div/>', {
            class: 'rmenu_element',
            id: 'add_ent',
            text: 'add entity'
	    }).appendTo('#rmenu');
	  jQuery('<div/>', {
          class: 'rmenu_element',
          id: 'del_ele',
          text: 'delete element'
	    }).appendTo('#rmenu');
	  
      $("#add_ent").bind("click", function() {
      		var node_id = 'node_' + node_count;
			annotations.nodes[node_id] = "";
			window.Sentiment.add_node(node_id, rclick.pageX, rclick.pageY, 'new node');
      });
          
      $("#del_ele").bind("click", function(e) {
      	alert("Deleting elements is not supported at the moment.");
      	return;
      	
      	jsPlumb.removeAllEndpoints(rclick.target);
      	jsPlumb.detachAllConnections(rclick.target);
      	
      	// also remove everything from annotations which includes rclick.target.id
      	// note that this is right click event and .target is the target of the click and nothing related to the annotation graph!
      	
      	rclick.target.remove();
      });   
      add_to_node_text = true;
      $("#popUpTable_arg").hide();
      $("#popUpTable_sent").show();
      
      jQuery('<div/>', {
          class: 'extra_sentential_node window',
          id: 'author',
          node_id: 'node_0',
          text: 'Autor'
      }).appendTo('#graph_part');
      jsPlumb.makeSource( $('#author'));
	},
	
	
	read_input_file : function (filename) {

		window.Sentiment.init_globals();
		jQuery.get('data/' + filename, function(data) {
			annotation_bundle_id = $(data).find('annotation_bundle').attr('id');
			// argumentation, sentiment
			annotation_type = $(data).find('annotation_bundle').attr('semantics');
			
			$('#rmenu').empty();
			if (annotation_type == 'argumentation')
				window.Sentiment.init_arg();
			else if (annotation_type == 'sentiment')
				window.Sentiment.init_sent();
			
		    var all_sentences = $(data).find('entity');
		    var sentence_idx = 0;
		    jQuery.each(all_sentences, function() {
				var current_sentence = $(this);

				var sentence_id = current_sentence.attr('id');
				text[sentence_id] = [];
				sentence_order.push(sentence_id);
				sentence_id_to_order[sentence_id] = sentence_idx;
				++sentence_count;
				var words = current_sentence.find('token_range');
				jQuery.each(words, function() {
					var t_id = $(this).attr('id');
					text[sentence_id].push({token: $(this).text(), trid: t_id});
				});
				++sentence_idx;
			});
			window.Sentiment.next_sentence(false);
		});
	},
	
	
	read_plain_input_file : function (filename) {
		//var filename = "sentences.txt";
		window.Sentiment.init_globals();
		jQuery.get('data/' + filename, function(data) {
		    var all_sentences = data.split("\n");
		    var sentence_idx = 0;
		    jQuery.each(all_sentences, function() {
				var current_sentence = this;
				if (current_sentence == "") 
					return false;
				var sentence_id = "" + sentence_idx;
				text[sentence_id] = [];
				sentence_order.push(sentence_id);
				++sentence_count;
				var words = current_sentence.split(" ");
				jQuery.each(words, function() {
					text[sentence_id].push(this);
				});
				++sentence_idx;
			});
			window.Sentiment.next_sentence(false);
		});
		
	},
	

    update : function () {
	    // list of possible anchor locations for the blue source element
	    var sourceAnchors;
	    sourceAnchors = [
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
			},
		"support": {
				//Pfeilkopf, durchgezogen
				paintStyle: {strokeStyle: "black", lineWidth: 3.5}, 
				hoverPaintStyle: {strokeStyle: "black", lineWidth: 5},
			},
		"support_by_example": {
				//Pfeilkopf, gestrichelt
				paintStyle: {dashstyle:"2 4", strokeStyle: "black", lineWidth: 3.5}, 
				hoverPaintStyle: {dashstyle:"2 4", strokeStyle: "black", lineWidth: 5},
			},
		"rebut": {
				//Kreiskopf, durchgezogen
				paintStyle: {strokeStyle: "black", lineWidth: 3.5}, 
				hoverPaintStyle: {strokeStyle: "black", lineWidth: 5},
			},
		"undercut": {
				//Kreiskopf, durchgezogen
				paintStyle: {strokeStyle: "black", lineWidth: 3.5}, 
				hoverPaintStyle: {strokeStyle: "black", lineWidth: 5},
			},
		"add_source": {
				// kein kopf, durchgezogen
				paintStyle: {strokeStyle: "black", lineWidth: 3.5}, 
				hoverPaintStyle: {strokeStyle: "black", lineWidth: 5},
			},
		});

//        var ent_endpoints = {
//        		anchor: ["TopCenter", "BottomCenter", "RightMiddle", "LeftMiddle"],
//        		endpoint: ["Dot", {radius: 5}],
//        		isSource: true,
//        		/*connectorOverlays: [
//					[ "Arrow", {width:2, length: 3, location: 0.9, id: "arrow"} ]
//				],*/
//        		paintStyle: {
//        			gradient: { stops: [ [ 0, "#004F66" ], [1, "#004F66"] ] },
//        			strokeStyle: "black",
//        			fillStyle: "#004F66",
//        			lineWidth: 1.5
//        		}
//	    };
        
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
        jsPlumb.draggable(allMovables, {
			start : function (event, ui) {
			},
			drag : function (event, ui) {
				changed = true;
				jsPlumb.repaintEverything();
			},
			stop : function (event, ui) {
			}
		});
        
        var wordDivs = $(".word, .word_arg, .word_sent");
        jsPlumb.makeSource(wordDivs, {
            anchor: ["TopCenter"],
            endpoint: ["Dot", {radius: 0}],
            paintStyle: {
            	lineWidth: 0
            }
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
    },
        
        
	labelPopUpButton_click : function (label_node_id, pol, text, ctxt, wk, irn, rhtrc, c_t) {
		changed = true;
		var polarity = null;
		var text_anchor = null;
		var context = null;
		var worldknowledge = null;
		var irony = null;
		var rhetoric = null;
		var ln_id = null;
		var old = false;
		var c_type = null;
		if (annotations.edges[current_source][current_target][current_connection.id]["label_node_id"] != null)
                        old = true;	

	
		//var sentence_id = sentence_order[current_sentence_idx];
		
		if (label_node_id != null)
			ln_id = label_node_id;
		else {
		        if (old)
                                ln_id = annotations.edges[current_source][current_target][current_connection.id]["label_node_id"];
                        else
                                ln_id = 'node_' + node_count;
		}
		
		if (text != null)
			text_anchor = text;
		else
			text_anchor = $('textarea#text_anchor_input').val();
		
		annotations.edges[current_source][current_target][current_connection.id]["label_node_id"] = ln_id;
		
		if (annotation_type == 'sentiment') {
			if (pol != null)
				polarity = pol;
			else
				polarity = $('input[name="polarity"]:checked').val();
			
			if (ctxt != null)
				context = ctxt;
			else
				context = $('input[name="context"]:checked').val();
			
			if (wk != null)
				worldknowledge = wk;
			else
				worldknowledge = $('input[name="wknow"]:checked').val();
			
			if (irn != null)
				irony = irn;
			else
				irony = $('input[name="ironic"]:checked').val();
			
			if (rhtrc != null)
				rhetoric = rhtrc;
			else
				rhetoric = $('input[name="rhetoric"]:checked').val();
			
			annotations.edges[current_source][current_target][current_connection.id]["polarity"] = polarity;
			annotations.edges[current_source][current_target][current_connection.id]["text_anchor"] = text_anchor;
			
			if (context)
				annotations.edges[current_source][current_target][current_connection.id]["context"] = true;
			else
				annotations.edges[current_source][current_target][current_connection.id]["context"] = false;
			if (worldknowledge)
				annotations.edges[current_source][current_target][current_connection.id]["world_knowledge"] = true;
			else
				annotations.edges[current_source][current_target][current_connection.id]["world_knowledge"] = false;
			if (irony)
				annotations.edges[current_source][current_target][current_connection.id]["ironic"] = true;
			else
				annotations.edges[current_source][current_target][current_connection.id]["ironic"] = false;
			if (rhetoric)
				annotations.edges[current_source][current_target][current_connection.id]["rhetoric"] = true;
			else
				annotations.edges[current_source][current_target][current_connection.id]["rhetoric"] = false;
			
			if (polarity == 'negative' && !current_connection.hasType('negative')) {
				current_connection.toggleType('negative');
			}
			else if (polarity == 'positive' && !current_connection.hasType('positive')) {
				current_connection.toggleType('positive');
			}
		}
		else if (annotation_type == 'argumentation') {
			if (c_t != null)
				c_type = c_t;
			else
				c_type = $('input[name="c_type"]:checked').val();
			c_type = c_type.replace('(', '').replace(')','');
			annotations.edges[current_source][current_target][current_connection.id]["c_type"] = c_type;
			
			if (c_type == 'support' && !current_connection.hasType('support')) {
				current_connection.toggleType('support');
			}
			else if (c_type == 'support_by_ex' && !current_connection.hasType('support_by_example')) {
				current_connection.toggleType('support_by_example');
			}
			else if (c_type == 'rebut' && !current_connection.hasType('rebut')) {
				current_connection.toggleType('rebut');
			}
			else if (c_type == 'undercut' && !current_connection.hasType('undercut')) {
				current_connection.toggleType('undercut');
			}
			else if (c_type == 'additional source' && !current_connection.hasType('undercut')) {
				current_connection.toggleType('add_source');
			}
		}
		$('#labelPopUp').hide();
		if (polarity == 'negative' || polarity == 'positive' || c_type == 'support_by_ex' || c_type == 'support') {
			current_connection.addOverlay(['Arrow', { foldback:0.2, location:0.75, width:10 }]);
		}
		else if (c_type == 'rebut' || c_type == 'undercut') {
			current_connection.addOverlay(["Custom", { create: function(component) {
					return $('<div></div>');
				},
				location: 0.97,
				cssClass: "circle rebut_undercut_circle"
				//id: "labelNode"					//(["Label", {label: text_anchor, id: "label", cssClass: "edge_label target"}]);
			}]);
		}
		
		var arc_label = text_anchor;
		if (c_type == 'rebut') 
			arc_label = 'rebut';
		if (c_type == 'undercut') 
			arc_label = 'undercut';
		if (c_type == 'support') 
			arc_label = 'support';
		if (c_type == 'support_by_ex') 
			arc_label = 'example';
		
		if (c_type != 'additional source') {
			current_connection.addOverlay(["Custom", { create: function(component) {
									return $('<div id="' + ln_id + '" class="edge_label target">'+arc_label+'</div>');
								},
								location: 0.5,
								cssClass: "edge_label target",
								id: "labelNode"					//(["Label", {label: text_anchor, id: "label", cssClass: "edge_label target"}]);
								}]);
		}
		
		
		if (!old && c_type != 'additional source')
			++node_count;
		window.Sentiment.update();
	},
	
	
	showAttrsPopUp : function(c) {
	        if (c.source.nodeName == "SPAN")
	            return false;
	    current_source = c.sourceId;
	    current_target = c.targetId;
	    current_connection = c;
	    $('#labelPopUp').show();
	    $(window).resize();
	    $('textarea#text_anchor_input').val('');
	    setTimeout(function() {
	    	  $('#text_anchor_input').focus();
	    	}, 0);
	    
	    
	    return false;
	},
        
        init : function() {         
            $('#rmenu').hide();
            $('#labelPopUp').hide();
            $('#saved').hide();
            window.Sentiment.get_files_to_be_annotated();
            window.Sentiment.update();
            
            $(document.body).keydown( function(event) {
                var pressed = event.keyCode || event.which;
                if ( $('#labelPopUp').is(":visible") && !($('#text_anchor_input').is(':focus')) && annotation_type == 'sentiment') {
					// c
					if (pressed == 67) {
						document.getElementById("context_chbox").checked = !document.getElementById("context_chbox").checked;
					    }
					 // w
					if (pressed == 87) {
						document.getElementById("wknow_chbox").checked = !document.getElementById("wknow_chbox").checked;
					    }
					 // i
					if (pressed == 73) {
						document.getElementById("ironic_chbox").checked = !document.getElementById("ironic_chbox").checked;
					    }
					 // r
					if (pressed == 82) {
						document.getElementById("rhetoric_chbox").checked = !document.getElementById("rhetoric_chbox").checked;
					}
					// n
					if (pressed == 78) {
					    $('input[name="polarity"]').val(['negative']);
					}
					// o
					if (pressed == 79) {
					    $('input[name="polarity"]').val(['other']);
					}
					// p
					if (pressed == 80) {
					    $('input[name="polarity"]').val(['positive']);
					}
					// return
					if (pressed == 13) {
					    $("#attrs_button").click();
					}
                }
                else if ( $('#labelPopUp').is(":visible") && annotation_type == 'argumentation') {
                    // s
                    if (pressed == 83) {
                    	$('input[name="c_type"]').val(['support']);
                    }
                    // e
                    if (pressed == 69) {
                    	$('input[name="c_type"]').val(['support_by_example']);
                    }
                    // r
                    if (pressed == 82) {
                    	$('input[name="c_type"]').val(['rebut']);
                    }
                    // u
                    if (pressed == 85) {
                    	$('input[name="c_type"]').val(['undercut']);
                    }
                    // a
                    if (pressed == 65) {
                    	$('input[name="c_type"]').val(['additional_source']);
                    }
                    // return
                    if (pressed == 13) {
                            $("#attrs_button").click();
                    }
                }
            });    
            
            $('#text_anchor_input').keydown( function(event) {
                var pressed = event.keyCode || event.which;
                if (pressed == 13 && ($('#text_anchor_input').is(':focus'))) {
                        $('#text_anchor_input').blur();
                }
                event.stopPropagation();
            });

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
            $("#psentence_button")[0].value = "←\nprevious\n←";
	    $("#psentence_button").css({
			float: "left"
		});
	    $("#nsentence_button")[0].value = "→\nnext\n→"; 
	    $("#nsentence_button").css({
			float: "right"
		});
        $("#graph_part").bind("contextmenu", function(e) {
        	rclick = e;
            $('#rmenu').css({
                top: e.pageY + 'px',
                left: e.pageX + 'px'
            }).show();
            return false;
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

        jsPlumb.bind("connection", function(i,c) {
        	changed = true;
        	if (i.connection.source.innerHTML == '+' || i.connection.target.innerHTML == '+') {
        		if (i.connection.source.innerHTML == '+') {
        			i.connection.target.innerHTML = alt_node_text;
        		}
        		i.connection.target.token_range_id += ";" + i.connection.source.token_range_id;
        		return;
        	}

        		// connection is re-dragged
                if (i.connection.sourceId in annotations.edges && i.connection.targetId in annotations.edges[i.connection.sourceId] && i.connection.id in annotations.edges[i.connection.sourceId][i.connection.targetId])
                        return;

            	// of the form "edges": {"node_0": {"node_1": "node_0_to_1_weight"}, ...}
            	if (!(i.connection.sourceId in annotations.edges))
            		annotations.edges[i.connection.sourceId] = {};
            	if (!(i.connection.targetId in annotations.edges[i.connection.sourceId]))
            		annotations.edges[i.connection.sourceId][i.connection.targetId] = {};
            	//var sentence_id = sentence_order[current_sentence_idx];
            	if (annotation_type == 'sentiment') {
            		annotations.edges[i.connection.sourceId][i.connection.targetId][i.connection.id] = {
            																				"label_node_id": null,
            																				"polarity": null, 
            																				"text_anchor": null,
            																				"context": false,
            																				"world_knowledge": false,
            																				"ironic": false,
            																				"rhetoric": false
            																				};
            	}
            	else if (annotation_type == 'argumentation') {
            		annotations.edges[i.connection.sourceId][i.connection.targetId][i.connection.id] = {
							"label_node_id": null,
							"arc_type": null
							};
            		
            	}

            	++edge_count;
            	
    			if (i.connection.source.nodeName != 'SPAN')
    				i.connection.toggleType('default');
    			if (i.connection.source.nodeName == 'SPAN' && (i.connection.target.innerText == 'new node' || i.connection.target.innerHTML == 'new node')) {
    				if (add_to_node_text) 
    					i.connection.target.innerHTML = i.connection.source.innerHTML;
    				else
    					i.connection.target.innerHTML = alt_node_text;
    				//annotations.nodes[i.connection.targetId] = i.connection.source.innerHTML;
    			}
    			if (i.connection.source.nodeName == 'SPAN' && i.connection.target.innerHTML.indexOf(i.connection.source.innerHTML) < 0) {
    				if (add_to_node_text)
    					i.connection.target.innerHTML += ";" + i.connection.source.innerHTML;
    				//annotations.nodes[i.connection.targetId] += ";" + i.connection.source.innerHTML;
    			}

    			// only do this for non-edge nodes
    			if (i.connection.targetId in annotations.nodes) {
    	            if (annotations.nodes[i.connection.targetId] == "" && i.connection.source.nodeName == "SPAN") {
    	            	if (add_to_node_text)
    	            		annotations.nodes[i.connection.targetId] = i.connection.source.innerHTML;
    	            	else
    	            		annotations.nodes[i.connection.targetId] = alt_node_text;
    	            }
    	            else if (i.connection.source.nodeName == "SPAN" && annotations.nodes[i.connection.targetId].indexOf(i.connection.source.innerHTML) < 0)
    	                annotations.nodes[i.connection.targetId] += ";" + i.connection.source.innerHTML;
    			}
    			
    		// the connection and if not already there, the connected nodes have to be added to the internal model

    			var loading = false;
    			if (c == null)
    				loading = true;
    			if (!loading)
    				window.Sentiment.showAttrsPopUp(i.connection);
            }); 
            jsPlumb.bind("dblclick", function(c) {
            	window.Sentiment.showAttrsPopUp(c);
            });
            jsPlumb.bind("ready", function () {
                jsPlumb.addEndpoint($(".node"), ent_endpoints);
            });
            jsPlumb.bind("connectionMoved", function(info, orig_event) {
            	console.log("moving connections endpoints");
            });
    	    jsPlumb.bind("ready", function () {
    			jsPlumb.addEndpoint($(".node"), ent_endpoints);
		    });

            $('#rmenu').click(function() {
                $('#rmenu').hide();
            });
            $(document).click(function() {
                $('#rmenu').hide();
            });
	    $(window).resize( function() {
			$('.popUpContent').css({
			    position: 'absolute',
			    left: ($(window).width() - $('.popUpContent').width())/2,
			    top: ($(window).height() - $('.popUpContent').height())/2
			});
	    });
	    $(document).ready( function() {
	    	$(window).resize();
			window.Sentiment.update();
	    });
	    
        }

	};
