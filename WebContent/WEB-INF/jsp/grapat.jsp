<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
  <title>GraPAT</title>
  <meta name="description" content="An annotation tool for NLP problems which require graph representations.">
  <link rel="stylesheet" href="css/graph.css">
  <link rel="stylesheet" href="css/article.css">
  <script type='text/javascript' src='http://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min.js'></script>
  <script type='text/javascript' src='http://ajax.googleapis.com/ajax/libs/jqueryui/1.9.2/jquery-ui.min.js'></script>
  <script type='text/javascript' src='js/jquery.ui.touch-punch.min.js'></script>
  <script type='text/javascript' src='js/jquery.jsPlumb-1.5.1-min.js'></script>
  <script src="js/sentiment_annotation.js" type="text/javascript"></script>
</head>

<body>
	<div class="menu">
		<div class="menu_container">
			<input id="save" class="menu_button" value="Save" type="button" onclick="window.Sentiment.save();">
			<div id="saved">saved</div>
		</div>
		<div class="menu_container">
			<input id="log out" class="menu_button" value="Log out" type="button" onclick="window.Sentiment.logout();">
		</div>
	</div>
	<div id="main">
		<div id="render"></div>
		<div id="graph_part">
			<div id="labelPopUp" class="popUp">
			<div class="popUpContent">
				<h2 class="attrsHeadline">Attributes</h2>
				<div class="attrsContent">
					<table class="popUpTable">
					<tr>
						<td>text anchor</td>	<td> <textarea id="text_anchor_input" rows="1" cols="25"></textarea></td>
					</tr>
					<tr>
						<td>polarity</td>	<td> 	<form action=""> 	<input type="radio" name="polarity" value="negative"> negative <br>
													<input type="radio" name="polarity" value="positive"> positive <br>
													<input type="radio" name="polarity" value="other">other
										</form></td>
					</tr>
					<tr>
						<td>context</td>	<td>	<form action="">	<input type="checkbox" name="context"></form></td>
					</tr>
					<tr>
						<td>world knowledge</td> <td>	<form action="">	<input type="checkbox" name="wknow"></form></td>
					</tr>
					<tr>
						<td>ironic</td>		<td>	<form action="">	<input type="checkbox" name="ironic"></form></td>
					</tr>
					<tr>
						<td>rhetoric</td> 	<td>	<form action="">	<input type="checkbox" name="rhetoric"></form></td>
					</tr>
					</table>
					<input type="button" class="menu_button" value="close" onclick="window.Sentiment.labelPopUpButton_click();">
				</div>
			</div>
			</div>
			<div id="author" class="node extra_sentential_node window" node_id='node_0'>Autor</div>
			<div id="rmenu">
				<div id="add_ent" class="rmenu_element"> add entity/event </div>
				<div id="del_ele" class="rmenu_element"> delete element </div>
			</div>
		</div>
		<input id="psentence_button" class="sentence_button" type="button" onclick="window.Sentiment.previous_sentence();">
		<input id="nsentence_button" class="sentence_button" type="button" onclick="window.Sentiment.next_sentence();">
		<div id="source_text">
			<div id="sentence" >
				<span id="word1" class="word window">Wir</span>
				<span id="word2" class="word window">lehnen</span>
				<span id="word3" class="word window">das</span>
				<span id="word4" class="word window">waehrend</span>
				<span id="word5" class="word window">Moskau</span>
				<span id="word6" class="word window">es</span>
				<span id="word7" class="word window">leider</span>
				<span id="word8" class="word window">begruesst</span>
				<span id="word9" class="word window">.</span>
			</div>
		</div>
		<div id="counter"></div>
	</div>
	<script type='text/javascript'>
		window.Sentiment.init();
	</script>
</body>

</html>