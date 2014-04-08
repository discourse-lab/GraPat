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
  <script src="http://code.jquery.com/ui/1.10.3/jquery-ui.js"></script>
  <script type='text/javascript' src='js/jquery.ui.touch-punch.min.js'></script>
  <script type='text/javascript' src='js/jquery.jsPlumb-1.5.1-min.js'></script>
  <script src="js/sentiment_annotation.js" type="text/javascript"></script>
</head>

<body>
	<div class="menu">
		<div class="menu_container">
			<select id="annot_file_select" name="annot_file_select" onchange="window.Sentiment.change_annot_file();">
			    <option value="" disabled="disabled" selected="selected">Please select a file for annotation</option>
			</select>
		</div>
		<div class="menu_container">
			<input id="save" class="menu_button" value="Save" type="button" onclick="window.Sentiment.save();">
			<div id="saved">saved</div>
		</div>
		<div class="menu_container">
			<input id="log out" class="menu_button" value="Log out" type="button" onclick="window.Sentiment.logout();">
		</div>
	</div>
	<div id="main">
		<div id="graph_part">
			<div id="labelPopUp" class="popUp">
			<div class="popUpContent">
				<h2 class="attrsHeadline">Attributes</h2>
				<div class="attrsContent">
					<table id="popUpTable_sent" class="popUpTable">
					<tr>
						<td><b>text anchor</b></td>	<td> <textarea id="text_anchor_input" rows="1" cols="25"></textarea></td>
					</tr>
					<tr>
						<td><b>(p)olarity</b></td>	<td> 	<form action=""> 	<input type="radio" name="polarity" value="negative"> negative <br>
													<input type="radio" name="polarity" value="positive"> positive <br>
													<input type="radio" name="polarity" value="other">other
										</form></td>
					</tr>
					<tr>
						<td><b>(c)ontext</b></td>	<td>	<form action="">	<input id="context_chbox" type="checkbox" name="context"></form></td>
					</tr>
					<tr>
						<td><b>(w)orld knowledge</b></td> <td>	<form action="">	<input id="wknow_chbox" type="checkbox" name="wknow"></form></td>
					</tr>
					<tr>
						<td><b>(i)ronic</b></td>		<td>	<form action="">	<input id="ironic_chbox" type="checkbox" name="ironic"></form></td>
					</tr>
					<tr>
						<td><b>(r)hetoric</b></td> 	<td>	<form action="">	<input id="rhetoric_chbox" type="checkbox" name="rhetoric"></form></td>
					</tr>
					</table>
				</div>
				<div class="attrsContent">
					<table id="popUpTable_arg" class="popUpTable">
					<tr>
						<td><b>connection type</b></td>	<td> 	<form action=""> 	<input type="radio" name="c_type" value="support"> support <br>
													<input type="radio" name="c_type" value="support_by_ex"> support by example <br>
													<input type="radio" name="c_type" value="rebut"> rebut <br>
													<input type="radio" name="c_type" value="undercut"> undercut <br>
													<input type="radio" name="c_type" value="additional source"> additional source
										</form></td>
					</tr>
					</table>
				</div>				
				<input type="button" id="attrs_button" class="menu_button" value="close" onclick="window.Sentiment.labelPopUpButton_click();">
			</div>
			</div>
			<div id="rmenu">
			</div>
		</div>
		<input id="psentence_button" class="sentence_button" type="button" onclick="window.Sentiment.previous_sentence();">
		<input id="nsentence_button" class="sentence_button" type="button" onclick="window.Sentiment.next_sentence();">
		<div id="source_text">
			<div id="sentence" >
			</div>
		</div>
		<div id="counter"></div>
	</div>
	<script type='text/javascript'>
		window.Sentiment.init();
	</script>
</body>

</html>