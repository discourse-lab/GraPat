/* TODO:
 * - delete specific relations by rightclick
 * - make segmentation connections transparent and more in the background 
 * - style all svg connection with cssClass
 * - logout functionality
 * - arg: disable the source-anchor for nodes with one outgoing arc. enable it after arc removal 
 */

var annotations = {
    "nodes": {},
    "edges": {}
};

var connections = {};

var changed = false;

var current_sentence_idx = -1;
var edge_count = 0;	// not really used in code, only for debug?
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


// endswith function for strings
// from: http://stackoverflow.com/a/2548133
if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function (suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

window.XMLParser = {},

    window.Sentiment = {

        update_node_count: function () {
            // since we want the first unused number, we can ommit the -1 which had to be there due to the author node being counted
            return $('.target').length + $('.node').length;
            // TODO: what if we have three nodes with ids 10, 11, 12 and the node_count is used to build new ids?
        },


        update_max_node_id: function () {
            // find the maximum node_id, following the id scheme "node_[int]"
            var max_node_id = 0;
            $.each($('.node, .target'), function () {
                if ('id' in this) {
                    var id = this.id;
                    var i = parseInt(id.split('_')[1]);
                    if (i > max_node_id) {
                        max_node_id = i;
                    }
                }
            });
            return max_node_id;
        },


        load_data: function (bundle_id, sentence_id, add_to_word_connections) {

            if (add_to_word_connections == null)
                add_to_word_connections = true;

            var sent_ord = sentence_id_to_order[sentence_id];
            if (sent_ord > 0) {
                $.when(window.Sentiment.load_data(bundle_id, sentence_order[sent_ord - 1], false)).then(
                    function () {
                        return window.Sentiment._request_and_add(bundle_id, sentence_id, add_to_word_connections);
                    });
            } else {
                return window.Sentiment._request_and_add(bundle_id, sentence_id, add_to_word_connections);
            }
        },


        _request_and_add: function (bundle_id, sentence_id, add_to_word_connections) {
            var req_data = {
                "bundle_id": bundle_id,
                "sentence_id": sentence_id,
                "username": $("username").val()
            };
            var delayed = [];
            var jreq = $.ajax({
                type: 'GET', url: "/grapat", data: req_data, dataType: "json", async: false, success: function (data) {
                    var graph = data.graph;
                    var layout = data.layout;

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
                        $.each(graph.nodes, function (key, attrs) {
                            var x = layout[key]["x"];
                            var y = layout[key]["y"];
                            window.Sentiment.add_node(key, x, y, attrs.label, attrs.n_type);
                        });

                        $.each(graph.edges, function (source_id, value) {
                            $.each(value, function (target_id, edges) {
                                $.each(edges, function (conn_id, attrs) {

                                    if ($('#' + target_id)[0] == null || $('#' + source_id)[0] == null) {
                                        if (!add_to_word_connections && (source_id.indexOf("word_") == 0 || target_id.indexOf("word_") == 0)) {

                                        } else
                                            delayed.push([source_id, target_id, attrs]);
                                        // jquery continue
                                        return true;
                                    }
                                    if (!add_to_word_connections && (source_id.indexOf("word_") == 0 || target_id.indexOf("word_") == 0)) {
                                    } else {
                                        current_connection = jsPlumb.connect({source: source_id, target: target_id});
                                        current_source = current_connection.sourceId;
                                        current_target = current_connection.targetId;
                                        if (current_connection.source.nodeName != "SPAN") {
                                            if (annotation_type == 'sentiment')
                                                window.Sentiment.labelPopUpButton_click(attrs.label_node_id, attrs.polarity, attrs.text_anchor, attrs.context, attrs.world_knowledge, attrs.ironic, attrs.rhetoric);
                                            else if (annotation_type == 'argumentation') {
                                                if (attrs.c_type != undefined && attrs.c_type != null) {
                                                    // don't call the labelPopUp for segmentation edges (which are of c_type undefined or null)
                                                    window.Sentiment.labelPopUpButton_click(attrs.label_node_id, null, null, null, null, null, null, attrs.c_type);
                                                }
                                            }
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
                                delayed.push([source_id, target_id, attrs]);
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
                    if (add_to_word_connections && annotation_type != 'argumentation') {
                        /* AP: this overwrites the annotations structure produced by calling jsPlumb.connect when loading,
                         *     with the result that connection_ids are not valid anymore and connections cannot be deleted anymore.
                         *     I guess this behaviour was intended for sentiment annotation over multiple sentence views.
                         *     Its not needed for argumentation annotation anymore and thus excluded in this annotation mode.
                         */
                        annotations = loaded_annotations;
                    }
                }
            });

            if (annotation_type == 'argumentation') {
                /* somethings wrong with the node count after loading.
                 * as a result no new nodes can be created. fix this by
                 * starting from the highest node.
                 */
                node_count = window.Sentiment.update_max_node_id() + 1;
            }

            return jreq;
        },


        add_node: function (node_id, x, y, label, type) {
            if (label == null)
                label = '';
            if (type == null)
                type = 'default';
            if ($('#' + node_id).length == 0) {
                // potentially overwriting something here?
                annotations.nodes[node_id] = {"label": label, "n_type": type};
                var new_node = jQuery('<div/>', {
                    class: 'window movable invisible node deletable',
                    id: node_id,
                    node_id: node_count,
                });
                new_node.appendTo('#graph_part');

                // add text span
                jQuery('<span/>', {id: node_id + '_span', text: label}).appendTo(new_node);

                new_node.css({
                    top: y,
                    left: x,
                    visibility: 'visible'
                });
                ++node_count;

                if (type == 'circle')
                    new_node.addClass("circle");

                // argumentation node types:
                if (type == 'node_type_proponent')
                    new_node.addClass("node_type_proponent");
                else if (type == 'node_type_opponent')
                    new_node.addClass("node_type_opponent");
                else if (type == 'node_type_edu_join')
                    new_node.addClass("node_type_edu_join");

                // add a source handle, from which new connections can be drawn.
                var source_handle = jQuery('<div/>', {id: node_id + '_source', class: 'source_handle'});
                source_handle.appendTo(new_node);
                jsPlumb.makeSource(source_handle, {
                    parent: new_node,
                    anchor: "Continuous",
                    connectorStyle: {
                        strokeStyle: "#5c96bc",
                        lineWidth: 2,
                        outlineColor: "transparent",
                        outlineWidth: 4
                    },
                    //endpoint:{ connectorOverlays: [[ "Arrow", {width:2, length: 3, location: 0.9, id: "arrow"} ]]},
                });


                window.Sentiment.update();
                changed = true;

//            var ent_endpoints = {
//                    anchor: ["BottomCenter", "RightMiddle", "LeftMiddle"], // "TopCenter", 
//                    endpoint: ["Dot", {radius: 10}],
//                    isSource: true,
//                    /*connectorOverlays: [
//                                    [ "Arrow", {width:2, length: 3, location: 0.9, id: "arrow"} ]
//                            ],*/
//                    paintStyle: {
//                            gradient: { stops: [ [ 0, "#004F66" ], [1, "#004F66"] ] },
//                            strokeStyle: "black",
//                            fillStyle: "#004F66",
//                            lineWidth: 1.5
//                    }
//            };
//            jsPlumb.addEndpoint($("#" + node_id), ent_endpoints);

            }
        },


        init_globals: function () {
            annotations = {
                "nodes": {},
                "edges": {}
            };
            connections = {};
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


        get_files_to_be_annotated: function () {
            $.getJSON("/resources", function (data) {
                $.each(data, function (key, value) {
                    $('#annot_file_select')
                        .append($('<option>', {value: key})
                            .text(value));
                });
            });
        },


        change_annot_file: function () {
            var flist = $("#annot_file_select")[0];
            //var key = flist.options[flist.selectedIndex].value;
            var value = flist.options[flist.selectedIndex].text;
            // console.log("file selection changed to " + key + ":" + value);

            window.Sentiment.read_input_file(value);
            window.Sentiment.update();
        },


        // trid: token range id
        add_word: function (to_add, wid, trid) {
            if ($('#word_' + wid).length == 0) {
                var word_type = "";
                if (annotation_type == 'sentiment') {
                    word_type = 'word_sent';
                } else if (annotation_type == 'argumentation') {
                    word_type = 'word_arg';
                    to_add = '[' + trid + '] ' + to_add;
                }
                jQuery('<span/>', {
                    class: word_type + ' window',
                    id: 'word_' + wid,
                    text: to_add,
                    token_range_id: trid
                }).appendTo($("#sentence"));

                var required_width = 0;
                jQuery.each($('.word_arg'), function () {
                    required_width += $(this).width() + parseInt($(this).css('margin-left')) + parseInt($(this).css('margin-right')) + parseInt($(this).css('padding-left')) + parseInt($(this).css('padding-right')) + parseInt($(this).css('border-width')) * 2;
                });

                jQuery.each($('.word_sent'), function () {
                    required_width += $(this).width() + parseInt($(this).css('margin-left')) + parseInt($(this).css('margin-right')) + parseInt($(this).css('padding-left')) + parseInt($(this).css('padding-right')) + parseInt($(this).css('border-width')) * 2;
                });

                if (required_width > $(document).width()) {
                    $('body').css('width', $(document).width() + $('#word_' + wid).width() + parseInt($('#word_' + wid).css('margin-left')) + parseInt($('#word_' + wid).css('margin-right')) + parseInt($('#word_' + wid).css('padding-left')) + parseInt($('#word_' + wid).css('padding-right')) + parseInt($('#word_' + wid).css('border-width')) * 2 + 'px');
                } else {
                    $('body').css('width', $(document).width());
                }
            }
        },


        word_update: function () {
            var sentence_div = $("#sentence");
            $("#counter")[0].innerHTML = current_sentence_idx + 1 + " of " + sentence_count;
            $("#counter")[0].innerText = current_sentence_idx + 1 + " of " + sentence_count;
            // remove connections and anchor points to word divs
            // TODO
            // remove old words
            sentence_div.empty();


            var idx = 0;
            jQuery.each(text[sentence_order[current_sentence_idx]], function () {
                window.Sentiment.add_word(this['token'], idx, this['trid']);
                ++idx;
            });
        },


        next_sentence: function (sa) {
            sa = (typeof sa === 'undefined') ? true : sa;

            if (sa && changed)
                window.Sentiment.save();

            if (current_sentence_idx < sentence_count - 1) {
                annotations = {
                    "nodes": {},
                    "edges": {}
                };
                ++current_sentence_idx;
                // resetting the width to avoid increasingly big left and right margins
                $('body').css('width', 100);
                window.Sentiment.word_update();
                window.Sentiment.clear();
                window.Sentiment.load_data(annotation_bundle_id, sentence_order[current_sentence_idx]);
            }
        },


        previous_sentence: function () {
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


        clear: function () {
            jsPlumb.detachEveryConnection();
            jsPlumb.deleteEveryEndpoint();
            $('.node').remove();
        },


        clear_annotation: function () {
            bootbox.confirm("Do you really want to clear this annotation?", function (result) {
                if (result == true) {
                    annotations = {"nodes": {}, "edges": {}};
                    connections = {};
                    window.Sentiment.clear();
                    changed = true;
                }
            });
        },

        save: function () {
            if (!changed) {
                alert("Nothing changed.");
                return;
            }
            // node_id -> x,y coordinates
            var layout = {};
            var nodes = $(".node");
            $.each(nodes, function () {
                if (!($(this)[0].id in layout))
                    layout[$(this)[0].id] = {};
                layout[$(this)[0].id]["x"] = $(this).css("left");
                layout[$(this)[0].id]["y"] = $(this).css("top");
            });

            let username = $("#username").val()

            $.post('/grapat', {
                    "annotation_bundle": annotation_bundle_id,
                    "sentence": sentence_order[current_sentence_idx],
                    "layout": JSON.stringify(layout),
                    "graph": JSON.stringify(annotations),
                    "annotator": JSON.stringify(username),
                },
                function (data) {
                    $("#saved").hide().fadeIn(1500);
                    $("#saved").fadeOut(2500);
                }
            );
            changed = false;
        },

        exportDB: function () {
            let username = $("#username").val()
            $.post('/grapat/export', {
                    "annotator": JSON.stringify(username),
                },
                function (data) {
                    $("#exported").hide().fadeIn(1500);
                    $("#exported").fadeOut(2500);
                }
            );
        },

        logout: function () {
        },


        verify_node_id: function (element) {
            // the delete menu can be triggered by every element in a node, so lets make sure
            // the id is really that of the node and not of the span or source handle
            node_id = element.id;
            if (node_id.endsWith('_span') || node_id.endsWith('_source')) {
                node_id = rclick.target.parentNode.id;
            }
            return node_id;
        },

        remove_incoming_edges: function (node_id) {
            // model: remove all connections to this node
            for (var other_source_id in annotations.edges) {
                if (node_id in annotations.edges[other_source_id]) {
                    window.Sentiment.recursively_remove_connection(other_source_id, node_id);
                }
            }
        },


        remove_outgoing_edges: function (node_id) {
            // model: remove all connections from this node
            if (node_id in annotations.edges) {
                for (var other_target_id in annotations.edges[node_id]) {
                    window.Sentiment.recursively_remove_connection(node_id, other_target_id);
                }
                delete annotations.edges[node_id];
            }
        },


        recursively_remove_connection: function (source_id, target_id) {
            // this removes an edge from the model and from the view. if other edges point to this edge, they are recursively removed too.
            if (source_id in annotations.edges) {
                if (target_id in annotations.edges[source_id]) {
                    for (var connection_id in annotations.edges[source_id][target_id]) {
                        var label_node_id = annotations.edges[source_id][target_id][connection_id]['label_node_id'];
                        if (label_node_id != null) {
                            // recursively remove all connections to label node
                            for (var other_source_id in annotations.edges) {
                                if (label_node_id in annotations.edges[other_source_id]) {
                                    window.Sentiment.recursively_remove_connection(other_source_id, label_node_id);
                                }
                            }
                            // remove seen connections from an to the label node
                            jsPlumb.removeAllEndpoints(label_node_id);
                            jsPlumb.detachAllConnections(label_node_id);
                        }
                        // remove seen conntection
                        jsPlumb.detach(connections[connection_id]);
                        delete connections[connection_id];
                    }
                    // remove edge from model
                    delete annotations.edges[source_id][target_id];
                }
            }
        },


        init_arg: function () {
            // initialize the context menue of the graph area (rmenu) with argumentation specific entries
            jQuery('<div/>', {
                class: 'rmenu_element',
                id: 'add_circle_ent',
                text: 'add ADU proponent'
            }).appendTo('#rmenu');
            jQuery('<div/>', {
                class: 'rmenu_element',
                id: 'add_square_ent',
                text: 'add ADU opponent'
            }).appendTo('#rmenu');
            jQuery('<div/>', {
                class: 'rmenu_element',
                id: 'add_join_edus',
                text: 'add EDU join'
            }).appendTo('#rmenu');

            // bind functions to the rmenu entries
            $("#add_square_ent").bind("click", function () {
                var node_id = 'node_' + node_count;
                annotations.nodes[node_id] = {};
                window.Sentiment.add_node(node_id, rclick.pageX, rclick.pageY, 'new node', 'node_type_opponent');
            });
            $("#add_circle_ent").bind("click", function () {
                var node_id = 'node_' + node_count;
                annotations.nodes[node_id] = {};
                window.Sentiment.add_node(node_id, rclick.pageX, rclick.pageY, 'new node', 'node_type_proponent');
            });
            $("#add_join_edus").bind("click", function () {
                var node_id = 'node_' + node_count;
                annotations.nodes[node_id] = {};
                window.Sentiment.add_node(node_id, rclick.pageX, rclick.pageY, '+', 'node_type_edu_join');
            });

            // bind functions to the node context menu (dmenu)
            $("#del_node").bind("click", function (e) {
                node_id = window.Sentiment.verify_node_id(rclick.target);
                // model: remove edges
                window.Sentiment.remove_incoming_edges(node_id);
                window.Sentiment.remove_outgoing_edges(node_id);
                // model: remove node
                delete annotations.nodes[node_id];
                // TODO: what about all those counters
                // view: remove all connections from and to the element
                jsPlumb.removeAllEndpoints(rclick.target);
                jsPlumb.detachAllConnections(rclick.target);
                // view: remove the element (and all its subelements)
                $('#' + node_id).remove();
                changed = true;
            });
            $("#del_inarcs").bind("click", function (e) {
                node_id = window.Sentiment.verify_node_id(rclick.target);
                window.Sentiment.remove_incoming_edges(node_id);
                changed = true;

            });
            $("#del_outarcs").bind("click", function (e) {
                node_id = window.Sentiment.verify_node_id(rclick.target);
                window.Sentiment.remove_outgoing_edges(node_id);
                changed = true;
            });

            add_to_node_text = false;
            alt_node_text = 'ADU';

            $("#popUpTable_arg").show();
            $("#popUpTable_sent").hide();

        },


        init_sent: function () {
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

            $("#add_ent").bind("click", function () {
                var node_id = 'node_' + node_count;
                annotations.nodes[node_id] = "";
                window.Sentiment.add_node(node_id, rclick.pageX, rclick.pageY, 'new node');
            });

            $("#del_ele").bind("click", function (e) {
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
            jsPlumb.makeSource($('#author'));
        },


        read_input_file: function (filename) {

            window.Sentiment.init_globals();
            jQuery.get('resources/' + filename, function (data) {
                annotation_bundle_id = filename;
                // argumentation, sentiment
                annotation_type = $(data).find('annotation_bundle').attr('semantics');

                $('#rmenu').empty();
                $('#author').remove();
                $('#author').remove();

                if (annotation_type == 'argumentation')
                    window.Sentiment.init_arg();
                else if (annotation_type == 'sentiment')
                    window.Sentiment.init_sent();

                var all_sentences = $(data).find('entity');
                var sentence_idx = 0;
                jQuery.each(all_sentences, function () {
                    var current_sentence = $(this);

                    var sentence_id = current_sentence.attr('id');
                    text[sentence_id] = [];
                    sentence_order.push(sentence_id);
                    sentence_id_to_order[sentence_id] = sentence_idx;
                    ++sentence_count;
                    var words = current_sentence.find('token_range');
                    jQuery.each(words, function () {
                        var t_id = $(this).attr('id');
                        text[sentence_id].push({token: $(this).text(), trid: t_id});
                    });
                    ++sentence_idx;
                });
                window.Sentiment.next_sentence(false);
            });
        },


        read_plain_input_file: function (filename) {
            //var filename = "sentences.txt";
            window.Sentiment.init_globals();
            jQuery.get('resources/' + filename, function (data) {
                var all_sentences = data.split("\n");
                var sentence_idx = 0;
                jQuery.each(all_sentences, function () {
                    var current_sentence = this;
                    if (current_sentence == "")
                        return false;
                    var sentence_id = "" + sentence_idx;
                    text[sentence_id] = [];
                    sentence_order.push(sentence_id);
                    ++sentence_count;
                    var words = current_sentence.split(" ");
                    jQuery.each(words, function () {
                        text[sentence_id].push(this);
                    });
                    ++sentence_idx;
                });
                window.Sentiment.next_sentence(false);
            });

        },


        update: function () {
            // list of possible anchor locations for the blue source element
            var sourceAnchors;
            sourceAnchors = [
                [0, 1, 0, 1],
                [0.25, 1, 0, 1],
                [0.5, 1, 0, 1],
                [0.75, 1, 0, 1],
                [1, 1, 0, 1],
                "TopCenter", "RightMiddle", "LeftMiddle"
            ];

            jsPlumb.importDefaults({
                // set default anchors.  the 'connect' calls below will pick these up, and in fact setting these means
                // that you also do not need to supply anchor definitions to the makeSource or makeTarget functions.
                Anchors: [sourceAnchors],
                Connector: ["Bezier", {curviness: 50}],
                // drag options
                DragOptions: {cursor: "pointer", zIndex: 2000},
                // default to blue at source and green at target
                EndpointStyles: [{fillStyle: "black"}, {fillStyle: "#black"}],
                // blue endpoints 7 px; green endpoints 11.
                Endpoints: [["Dot", {radius: 2}], ["Dot", {radius: 2}]],
                // default to a gradient stroke from blue to green.  for IE provide all green fallback.
                PaintStyle: {
                    //gradient:{ stops:[ [ 0, "black" ], [ 1, "black" ] ] },
                    strokeStyle: "black",
                    lineWidth: 1.5
                },
                hoverPaintStyle: {
                    strokeStyle: "black",
                    lineWidth: 5
                },
                ConnectionsDetachable: false,
            });

            var red = "#680707";
            var green = "#1D6807";
            jsPlumb.registerConnectionTypes({
                "default": {
                    paintStyle: {strokeStyle: "black", lineWidth: 1.5},
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
                "segmentation": {
                    paintStyle: {strokeStyle: "#DDD", lineWidth: 2.5},
                    hoverPaintStyle: {strokeStyle: "#DDD", lineWidth: 5},
                },
                "support": {
                    //Pfeilkopf, durchgezogen
                    paintStyle: {strokeStyle: "black", lineWidth: 2.5},
                    hoverPaintStyle: {strokeStyle: "black", lineWidth: 5},
                },
                "support_by_example": {
                    //Pfeilkopf, gestrichelt
                    paintStyle: {dashstyle: "2 4", strokeStyle: "black", lineWidth: 2.5},
                    hoverPaintStyle: {dashstyle: "2 4", strokeStyle: "black", lineWidth: 5},
                },
                "rebut": {
                    //Kreiskopf, durchgezogen
                    paintStyle: {strokeStyle: "black", lineWidth: 2.5},
                    hoverPaintStyle: {strokeStyle: "black", lineWidth: 5},
                },
                "undercut": {
                    //Kreiskopf, durchgezogen
                    paintStyle: {strokeStyle: "black", lineWidth: 2.5},
                    hoverPaintStyle: {strokeStyle: "black", lineWidth: 5},
                },
                "additional_source": {
                    // kein kopf, durchgezogen
                    paintStyle: {strokeStyle: "black", lineWidth: 2.5},
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
            $(".node").each(function (index) {
                jsPlumb.makeTarget($(this), {
                    anchor: "Continuous" //sourceAnchors,
                });
            });

            $(".target").each(function (index) {
                jsPlumb.makeTarget($(this), {
                    anchor: "Continuous"
                });
            });

            var allMovables = $(".movable");
            // make them draggable
            jsPlumb.draggable(allMovables, {
                start: function (event, ui) {
                },
                drag: function (event, ui) {
                    changed = true;
                    jsPlumb.repaintEverything();
                },
                stop: function (event, ui) {
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


        labelPopUpButton_click: function (label_node_id, pol, text, ctxt, wk, irn, rhtrc, c_t) {
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

            if (label_node_id != null) {
                ln_id = label_node_id;
            } else {
                if (old) {
                    ln_id = annotations.edges[current_source][current_target][current_connection.id]["label_node_id"];
                } else {
                    ln_id = 'node_' + node_count;
                }
            }

            if (text != null) {
                text_anchor = text;
            } else {
                text_anchor = $('textarea#text_anchor_input').val();
            }

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
                } else if (polarity == 'positive' && !current_connection.hasType('positive')) {
                    current_connection.toggleType('positive');
                }
            } else if (annotation_type == 'argumentation') {
                if (c_t != null) {
                    c_type = c_t;
                } else {
                    c_type = $('input[name="c_type"]:checked').val();
                }
                annotations.edges[current_source][current_target][current_connection.id]["c_type"] = c_type;

                if (c_type == 'support' && !current_connection.hasType('support')) {
                    current_connection.toggleType('support');
                } else if (c_type == 'support_by_example' && !current_connection.hasType('support_by_example')) {
                    current_connection.toggleType('support_by_example');
                } else if (c_type == 'rebut' && !current_connection.hasType('rebut')) {
                    current_connection.toggleType('rebut');
                } else if (c_type == 'undercut' && !current_connection.hasType('undercut')) {
                    current_connection.toggleType('undercut');
                } else if (c_type == 'additional_source' && !current_connection.hasType('additional_source')) {
                    current_connection.toggleType('additional_source');
                }
            }
            $('#labelPopUp').hide();

            // add arrow heads as overlay
            if (polarity == 'negative' || polarity == 'positive') {
                current_connection.addOverlay(['Arrow', {foldback: 0.2, location: 0.75, width: 10}]);
            } else if (c_type == 'support_by_example' || c_type == 'support') {
                current_connection.addOverlay(['Arrow', {foldback: 0.66, location: 1, width: 10, length: 12}]);
            } else if (c_type == 'rebut' || c_type == 'undercut') {
                current_connection.addOverlay(["Custom", {
                    create: function (component) {
                        return $('<div></div>');
                    },
                    location: 1,
                    cssClass: "circle rebut_undercut_circle"
                }]);
            }

            // add edge node as overlay
            var arc_label = text_anchor;
            if (c_type == 'rebut')
                arc_label = 'rebut';
            if (c_type == 'undercut')
                arc_label = 'undercut';
            if (c_type == 'support')
                arc_label = 'support';
            if (c_type == 'support_by_example')
                arc_label = 'example';

            if (c_type != 'additional_source') {
                current_connection.addOverlay(["Custom", {
                    create: function (component) {
                        return $('<div id="' + ln_id + '" class="edge_label target">' + arc_label + '</div>');
                    },
                    location: 0.5,
                    cssClass: "edge_label target",
                    id: "labelNode"					//(["Label", {label: text_anchor, id: "label", cssClass: "edge_label target"}]);
                }]);
            } else {
                // remove labelnode id
                annotations.edges[current_source][current_target][current_connection.id]["label_node_id"] = null;
            }


            if (!old && c_type != 'additional_source')
                ++node_count;

            window.Sentiment.update();
        },


        showAttrsPopUp: function (c) {
            if (c.source.nodeName == "SPAN")
                return false;
            current_source = c.sourceId;
            current_target = c.targetId;
            current_connection = c;
            $('#labelPopUp').show();
            $(window).resize();
            $('textarea#text_anchor_input').val('');
            setTimeout(function () {
                $('#text_anchor_input').focus();
            }, 0);
            return false;
        },


        connection_sent: function (i, c) {
            changed = true;

            // TODO: is this still needed for sentiment?
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
            annotations.edges[i.connection.sourceId][i.connection.targetId][i.connection.id] = {
                "label_node_id": null,
                "polarity": null,
                "text_anchor": null,
                "context": false,
                "world_knowledge": false,
                "ironic": false,
                "rhetoric": false
            };

            ++edge_count;

            // span components correspond to word nodes
            if (i.connection.source.nodeName != 'SPAN')
                i.connection.toggleType('default');

            var target_span = $('#' + i.connection.target.id + '_span')[0];

            if (i.connection.source.nodeName == 'SPAN' && (target_span.innerText == 'new node' || target_span.innerHTML == 'new node')) {
                if (add_to_node_text)
                    target_span.innerHTML = i.connection.source.innerHTML;
                else
                    target_span.innerHTML = alt_node_text;
                //annotations.nodes[i.connection.targetId] = i.connection.source.innerHTML;
            }
            if (i.connection.source.nodeName == 'SPAN' && target_span.innerHTML.indexOf(i.connection.source.innerHTML) < 0) {
                if (add_to_node_text)
                    target_span.innerHTML += ";" + i.connection.source.innerHTML;
                //annotations.nodes[i.connection.targetId] += ";" + i.connection.source.innerHTML;
            }

            // only do this for non-edge nodes
            if (i.connection.targetId in annotations.nodes) {
                if (annotations.nodes[i.connection.targetId]['label'] == "" && i.connection.source.nodeName == "SPAN") { //TODO: unclear what to do with the first condition
                    if (add_to_node_text)
                        annotations.nodes[i.connection.targetId]['label'] = i.connection.source.innerHTML;
                    else
                        annotations.nodes[i.connection.targetId]['label'] = alt_node_text;
                } else if (i.connection.source.nodeName == "SPAN" && annotations.nodes[i.connection.targetId]['label'].indexOf(i.connection.source.innerHTML) < 0)
                    annotations.nodes[i.connection.targetId]['label'] += ";" + i.connection.source.innerHTML;
            }

            // the connection and if not already there, the connected nodes have to be added to the internal model

            var loading = false;
            if (c == null)
                loading = true;
            if (!loading)
                window.Sentiment.showAttrsPopUp(i.connection);
        },


        _get_arg_semantic_type_of_element: function (e) {
            if (e.classList.contains('word_arg')) return "EDU";
            else if (e.classList.contains('node_type_edu_join')) return "EDU-JOIN";
            else if (e.classList.contains('edge_label')) return "EDGE";
            else if (e.classList.contains('node_type_proponent')) return "ADU";
            else if (e.classList.contains('node_type_opponent')) return "ADU";
            else return "unknown";
        },


        _get_arg_semantic_role_of_element: function (e) {
            if (e.classList.contains('node_type_proponent')) return "pro";
            else if (e.classList.contains('node_type_opponent')) return "opp";
            else return null;
        },


        _modal_choice_dialog: function (message, option1, option2, connection) {
            bootbox.dialog({
                "message": message,
                "closeButton": false,
                "buttons": {
                    choice1: {
                        "label": option1,
                        "className": "btn-primary",
                        "callback": function () {
                            window.Sentiment.labelPopUpButton_click(null, null, null, null, null, null, null, option1);
                        }
                    },
                    choice2: {
                        "label": option2,
                        "className": "btn-primary",
                        "callback": function () {
                            window.Sentiment.labelPopUpButton_click(null, null, null, null, null, null, null, option2);
                        }
                    },
                }
            });
        },


        _findSourceOfEdgeWithLabelNode: function (label_node_id) {
            // $.each doesnt work here, as i'd need to refer back to vars out of the inner callback function
            for (var source_id in annotations.edges) {
                for (var target_id in annotations.edges[source_id]) {
                    for (var conn_id in annotations.edges[source_id][target_id]) {
                        if (annotations.edges[source_id][target_id][conn_id]["label_node_id"] == label_node_id) {
                            return source_id;
                        }
                    }
                }
            }
            return null;
        },


        connection_arg: function (i, c) {
            changed = true;

            // connection is re-dragged
            if (i.connection.sourceId in annotations.edges && i.connection.targetId in annotations.edges[i.connection.sourceId] && i.connection.id in annotations.edges[i.connection.sourceId][i.connection.targetId]) {
                console.log("connection re-dragged", i.connection);
                return;
            }


            // get semantic types of source and target element and its role (for ADUs)
            var source_type = window.Sentiment._get_arg_semantic_type_of_element(i.connection.source);
            var source_role = window.Sentiment._get_arg_semantic_role_of_element(i.connection.source);
            var target_type = window.Sentiment._get_arg_semantic_type_of_element(i.connection.target);
            var target_role = window.Sentiment._get_arg_semantic_role_of_element(i.connection.target);

            // test whether connection is valid
            var valid_connections = ["EDU>ADU", "EDU>EDU-JOIN", "EDU-JOIN>ADU", "ADU>ADU", "ADU>EDGE"];
            var connection_description = source_type + '>' + target_type;
            if (valid_connections.indexOf(connection_description) < 0) {
                console.warn("Not a valid connection:" + connection_description);
                jsPlumb.detach(i.connection);
                return;
            }

            // add the edge to the model
            // of the form "edges": {"node_0": {"node_1": "node_0_to_1_weight"}, ...}
            if (!(i.connection.sourceId in annotations.edges))
                annotations.edges[i.connection.sourceId] = {};
            if (!(i.connection.targetId in annotations.edges[i.connection.sourceId]))
                annotations.edges[i.connection.sourceId][i.connection.targetId] = {};
            annotations.edges[i.connection.sourceId][i.connection.targetId][i.connection.id] = {
                "label_node_id": null,
                "c_type": null
            };
            connections[i.connection.id] = i.connection;
            ++edge_count;

            // eventually, we don't need to actually popup the edge classification
            // but in order to make labelPopUpButton_click work silently, we need to set the current connection
            current_source = i.connection.sourceId;
            current_target = i.connection.targetId;
            current_connection = i.connection;

            // don't show dialogues when loading
            var loading = false;
            if (c == null)
                loading = true;

            // depending on the type of edge, the target nodes description may change, or c_type choice is restricted
            if (connection_description == "EDU>ADU" || connection_description == "EDU-JOIN>ADU") {
                i.connection.toggleType('segmentation');
                var source_label = "";
                if (connection_description == "EDU>ADU") {
                    source_label = i.connection.source.getAttribute('token_range_id');
                } else {
                    //source_label = i.connection.source.innerHTML;
                    source_label = $('#' + i.connection.source.id + '_span')[0].innerHTML;
                }
                var target_span = $('#' + i.connection.target.id + '_span')[0];
                //if (i.connection.target.innerText == 'new node' || i.connection.target.innerHTML == 'new node') { //TODO: hardcoded hack
                if (target_span.innerHTML == 'new node') {
                    // ground the ADU in one EDU or EDU-JOIN
                    //i.connection.target.innerHTML = source_label;
                    target_span.innerHTML = source_label;
                } else {
                    // add a restatement
                    //i.connection.target.innerHTML += '='+source_label;
                    target_span.innerHTML += '=' + source_label;
                }
            } else if (connection_description == "EDU>EDU-JOIN") {
                i.connection.toggleType('segmentation');
                var source_trid = i.connection.source.getAttribute('token_range_id');
                var target_span = $('#' + i.connection.target.id + '_span')[0];
                //if (i.connection.target.innerHTML == '+') {
                if (target_span.innerHTML == '+') {
                    // add the first edu to the join node
                    //i.connection.target.innerHTML = source_trid+'+';
                    target_span.innerHTML = source_trid + '+';
                }
                //else if (i.connection.target.innerHTML.endsWith('+')) {
                else if (target_span.innerHTML.endsWith('+')) {
                    // add a second edu to the join node
                    //i.connection.target.innerHTML = i.connection.target.innerHTML+source_trid;
                    target_span.innerHTML = target_span.innerHTML + source_trid;
                } else {
                    // add another edu to the join node
                    //i.connection.target.innerHTML = i.connection.target.innerHTML+'+'+source_trid;
                    target_span.innerHTML = target_span.innerHTML + '+' + source_trid;
                }
            } else if (connection_description == "ADU>ADU") {
                if (source_role != null && target_role != null && source_role == target_role) {
                    // its either pro->pro or opp->opp: restrict popup to sup or ex c_type
                    if (!loading) {
                        window.Sentiment._modal_choice_dialog("Choose ADU>ADU class", "support", "support_by_example", i.connection);
                    }
                } else if (source_role != null && target_role != null && source_role != target_role) {
                    // its either pro->opp or opp->pro: thus the c_type is a rebutting one, no popup needed
                    window.Sentiment.labelPopUpButton_click(null, null, null, null, null, null, null, 'rebut');
                } else {
                    console.warn("Could not establish ADU->ADU link because the role of source or target ADU was null.");
                }
            } else if (connection_description == "ADU>EDGE") {
                // it's either an undercut or add_source, depending on the roles
                if (!loading) {
                    // find the sourceId of the targeted edge
                    var targetEdgeSourceId = window.Sentiment._findSourceOfEdgeWithLabelNode(i.connection.targetId);
                    if (targetEdgeSourceId != null && targetEdgeSourceId in annotations.nodes) {
                        // get the role of the edges sourceID, if targetEdgeSourceRole == sourceRole then add, else undercut
                        if (annotations.nodes[targetEdgeSourceId]["n_type"] == annotations.nodes[i.connection.sourceId]["n_type"]) {
                            window.Sentiment.labelPopUpButton_click(null, null, null, null, null, null, null, 'additional_source');
                        } else {
                            window.Sentiment.labelPopUpButton_click(null, null, null, null, null, null, null, 'undercut');
                        }
                    } else {
                        window.Sentiment._modal_choice_dialog("Choose ADU>EDGE class", "undercut", "additional_source", i.connection);
                    }
                }
            }
        },


        hide_all_context_menues: function () {
            $('#rmenu').hide();
            $('#dmenu').hide();
        },


        init: function () {
            window.Sentiment.hide_all_context_menues();
            $('#labelPopUp').hide();
            $('.userMessage').hide();
            window.Sentiment.get_files_to_be_annotated();
            window.Sentiment.update();

            $(document.body).keydown(function (event) {
                var pressed = event.keyCode || event.which;
                if ($('#labelPopUp').is(":visible") && !($('#text_anchor_input').is(':focus')) && annotation_type == 'sentiment') {
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
                } else if ($('#labelPopUp').is(":visible") && annotation_type == 'argumentation') {
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

            $('#text_anchor_input').keydown(function (event) {
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

            // bring up the normal context menue when rightclicking in the graph part
            $("#graph_part").on("contextmenu", function (e) {
                window.Sentiment.hide_all_context_menues();
                rclick = e;
                $('#rmenu').css({
                    top: e.pageY + 'px',
                    left: e.pageX + 'px'
                }).show();
                return false;
            });

            // bring up the noe deletion context menue when rightclicking on a node in the graph_part
            //$("#graph_part").on("contextmenu", ".deletable", function(e){
            $("#graph_part").on("contextmenu", ".node", function (e) {
                window.Sentiment.hide_all_context_menues();
                rclick = e;
                $('#dmenu').css({
                    top: e.pageY + 'px',
                    left: e.pageX + 'px'
                }).show();
                return false;
            });


//	    var ent_endpoints = {
//	        anchor: ["TopCenter", "BottomCenter", "RightMiddle", "LeftMiddle"],
//	        endpoint: ["Dot", {radius: 5}],
//	        isSource: true,
//	        /*connectorOverlays: [
//	                [ "Arrow", {width:2, length: 3, location: 0.9, id: "arrow"} ]
//	        ],*/
//	        paintStyle: {
//	                gradient: { stops: [ [ 0, "#004F66" ], [1, "#004F66"] ] },
//	                strokeStyle: "black",
//	                fillStyle: "#004F66",
//	                lineWidth: 1.5
//	        }
//	    };

            jsPlumb.bind("connection", function (i, c) {
                if (annotation_type == 'sentiment') {
                    window.Sentiment.connection_sent(i, c);
                } else if (annotation_type == 'argumentation') {
                    window.Sentiment.connection_arg(i, c);
                }
            });
            jsPlumb.bind("dblclick", function (c) {
                if (annotation_type != 'argumentation') {
                    window.Sentiment.showAttrsPopUp(c);
                }
            });

//        jsPlumb.bind("ready", function () {
//            jsPlumb.addEndpoint($(".node"), ent_endpoints);
//        });
//        jsPlumb.bind("connectionMoved", function(info, orig_event) {
//        	console.log("moving connections endpoints");
//        });
//	    jsPlumb.bind("ready", function () {
//			jsPlumb.addEndpoint($(".node"), ent_endpoints);
//	    });

            $('#rmenu').click(function () {
                window.Sentiment.hide_all_context_menues();
            });
            $('#dmenu').click(function () {
                window.Sentiment.hide_all_context_menues();
            });
            $(document).click(function () {
                window.Sentiment.hide_all_context_menues();
            });

            $(window).resize(function () {
                $('.popUpContent').css({
                    position: 'absolute',
                    left: ($(window).width() - $('.popUpContent').width()) / 2,
                    top: ($(window).height() - $('.popUpContent').height()) / 2
                });
            });
            $(document).ready(function () {
                $(window).resize();
                window.Sentiment.update();
            });

        }

    };
