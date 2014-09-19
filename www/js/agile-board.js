var aTaskboardUserStories = [];

function cleanMessages() {
	$('#messages').html('').hide();
}

function showMessage( msg_text, msg_class) {
	$('#messages').removeClass().addClass( msg_class ).html( msg_text ).show();
}

function loadTaskboard( group_id ) {
	$('#agile-board tbody').html('');

        $.ajax({
                type: 'POST',
                url: '/plugins/taskboard/ajax.php',
                dataType: 'json',
                data : {
                        action   : 'load_taskboard',
                        group_id : group_id
                },
                async: false
        }).done(function( answer ) {
                        if(answer['message']) {
                                showMessage(answer['message'], 'error');
                        }

                        aUserStories = answer['user_stories'];
                        aPhases = answer['phases'];

                        $( "#agile-board" ).append(
                                drawUserStories()
                        );

                        for(var i=0 ; i<aUserStories.length ; i++) {
                                drawUserStory( aUserStories[i] );
                        };
        });
}


function drawUserStories() {
	var l_sHtml = '';

	for( i=0; i<aUserStories.length; i++ ) {
		l_sHtml += "<tr valign='top'>\n";
		var start=0;
		var us=aUserStories[i];
		if( bShowUserStories ) {
			start=1;
			l_sHtml += '<td class="agile-phase"><div class="agile-sticker-container">';
			l_sHtml += '<div class="agile-sticker agile-sticker-user-story">';
			l_sHtml += '<div class="agile-sticker-header"><a href="#">' + us.id + '</a> : ' + us.title + "</div>\n";
			l_sHtml += '<div class="agile-sticker-body">' + us.description + "</div>\n";
			l_sHtml += '<div class="agile-sticker-footer">';
			l_sHtml += '<div id="user-story-progress-' +us.id + '" style="height: 12px; width: 150px; background: #FFFF99; float: left;"><span style="position:absolute; margin-left:10px;"></div>&nbsp;<span>RAF : </span><span id="user-story-raf-' + us.id + '"></span>';
			l_sHtml += "</div>\n</div>\n";
			l_sHtml += "</div></td>\n";
		}

		for( j=start; j<aPhases.length; j++) {
			var ph=aPhases[j];
			var style = '';
			if( ph.background ) {
				style = ' style="background-color:' + ph.background + ';"';
			}
			l_sHtml += '<td id="' + ph.id + '-' + us.id + '" class="agile-phase"' + style + '>';
			l_sHtml += "</td>\n";
		}

		l_sHtml += "</tr>\n";
	}

	return l_sHtml;
}

function helperTaskStart ( event, ui ) {
	$(this).css('opacity', 0.5);
}

function helperTaskStop ( event, ui ) {	
	$(this).css('opacity', 1);
}

function helperTaskDrop ( event, ui ) {
	var l_nUserStoryId = $( ui.draggable ).data('user_story_id');
	var l_nTaskId      = $( ui.draggable ).data('task_id');
	var l_nTargetPhaseId     = $(this).data('phase_id');
	
	setPhase( l_nUserStoryId, l_nTaskId, l_nTargetPhaseId );
}

function setPhase( nUserStoryId, nTaskId, nTargetPhaseId ) {
	var l_oUserStory;
	var l_oTargetPhase;
	var l_nSourcePhaseId;

	for( var i=0; i<aPhases.length ; i++ ) {
		if( aPhases[i].id == nTargetPhaseId ) {
			l_oTargetPhase = aPhases[i];
		}
	}

	for( var i=0; i<aUserStories.length ; i++ ) {
		if( aUserStories[i].id == nUserStoryId ) {
			l_oUserStory = aUserStories[i];
			for( var j=0; j<aUserStories[i].tasks.length ; j++ ) {
				if( aUserStories[i].tasks[j].id == nTaskId ) {
					l_nSourcePhaseId = aUserStories[i].tasks[j].phase_id;
				
					// apply some rules from phase configuration
					if( l_oTargetPhase && l_oTargetPhase.rules ) {
						// if exist a particular rule for current source phase
						var l_oRules = l_oTargetPhase.rules['*'];

						if( l_oTargetPhase.rules[l_nSourcePhaseId] ) {
							l_oRules = l_oTargetPhase.rules[l_nSourcePhaseId];
						}
						
						// then apply rules
						if( l_oRules ) {
							if( l_oRules.alert ) {
								alert( l_oRules.alert );
							} 

							aUserStories[i].tasks[j].resolution =  l_oRules.target_resolution;
					
							// try to save modifications
							$.ajax({
                						type: 'POST',
					                	url: '/plugins/taskboard/ajax.php',
					                	dataType: 'json',
					                	data : {
					                        	action   : 'drop_card',
									group_id : gGroupId,
        					                	task_id : nTaskId,
									target_phase_id : nTargetPhaseId
					                	},
					                	async: false
					        	}).done(function( answer ) {
                        					if(answer['message']) {
			                	                	showMessage(answer['message'], 'error');
									// change phase back
		        		                	}

								loadTaskboard( gGroupId );
        						});
						}
					}
				}	
			}			
		}
	} 
	
	if( l_oUserStory ) {
		drawUserStory(l_oUserStory);
	}
}

function updateUserStory( oUserStory ) {
	var nTotalCost=0;
	var nTotalRaf=0;
	
	for(var j=0 ; j<oUserStory.tasks.length ; j++) {
		nTotalCost += oUserStory.tasks[j].estimated_dev_effort;
		nTotalRaf  += oUserStory.tasks[j].remaining_estimated_effort;
	}

	drawProgressBar("#user-story-progress-" + oUserStory.id, nTotalCost, (nTotalCost - nTotalRaf));	
	
	$( "#user-story-raf-" + oUserStory.id ).html( nTotalRaf);
}

function drawProgressBar( id, estimated, remaining ) {
    $( id ).append(
        "<div style='width: " + (remaining * 100 / estimated ) + "%; height: 12px; background-color: #00FF00;'></div>"
    );
}

function drawUserStory( oUserStory ) {
	
	for( var i=0; i<aPhases.length ; i++ ) {
		if( aPhases[i].id != 'user-stories') {
			var sPhaseId = "#" + aPhases[i].id + "-" + oUserStory.id;
			$( sPhaseId ).html(
				drawTasks( oUserStory, aPhases[i].id )
			);
			
			//make phase droppable
			$( sPhaseId )
				.data('phase_id', aPhases[i].id)
				.droppable( {
				      accept: '.agile-sticker-task-' + oUserStory.id,
				      hoverClass: 'agile-phase-hovered',
				      drop: helperTaskDrop
				} );
				
		    	if( aPhases[i].background ) {
		        	$("#" + aPhases[i].id + "-" + oUserStory.id).css('background-color', aPhases[i].background );
		    	}
		}
	}
	
	var nTotalCost=0;
	var nTotalRaf=0;
	for(var j=0 ; j<oUserStory.tasks.length ; j++) {
		nTotalCost += oUserStory.tasks[j].estimated_dev_effort;
		nTotalRaf  += oUserStory.tasks[j].remaining_estimated_effort
		
		$('#task-' + oUserStory.tasks[j].id)
			.data('task_id', oUserStory.tasks[j].id)
			.data('user_story_id', oUserStory.id)
			.draggable( {
			      containment: '#agile-board',
			      //cursor: 'move',
			      stack: 'div',
			      revert: true,
			      start: helperTaskStart,
			      stop: helperTaskStop,
			      helper: "clone"
			} );
		
		// draw progress bar
		drawProgressBar("#task-progress-" + oUserStory.tasks[j].id, oUserStory.tasks[j].estimated_dev_effort, oUserStory.tasks[j].remaining_estimated_effort);
	}			

	$( "#user-story-progress-" + oUserStory.id ).html('<span style="position:absolute; margin-left:10px;">Cost: ' + nTotalCost + '</span>');
	drawProgressBar("#user-story-progress-" + oUserStory.id, nTotalCost, (nTotalCost - nTotalRaf));
	
	$( "#user-story-raf-" + oUserStory.id ).html( nTotalRaf);
	
//	initEditable();

}

function drawTasks( oUserStory, sPhaseId ) {
	var l_sHtml = '' ;

	for( i=0; i<oUserStory.tasks.length; i++ ) {
		tsk = oUserStory.tasks[i];
		if( taskInPhase( tsk, sPhaseId ) ) {
			l_sHtml += '<div class="agile-sticker-container">';
        	        l_sHtml += '<div class="agile-sticker agile-sticker-task agile-sticker-task-' + tsk.user_story + '" id="task-' + tsk.id + '">';
                	l_sHtml += '<div class="agile-sticker-header" style="background-color: ' + tsk.background + ';">';
	                l_sHtml += '<a href="#">' + tsk.id + '</a> : ' + tsk.title;
        	        l_sHtml += "</div>\n";
                	l_sHtml += '<div class="agile-sticker-body">' + tsk.description + '</div>';
	                l_sHtml += '<div class="agile-sticker-footer">';
        	        l_sHtml += '<div id="task-progress-' + tsk.id + '" style="height: 12px; width: 150px; background: #FFFF99; float: left;">';
			l_sHtml += '<span style="position:absolute; margin-left:10px;">Cost: ' + tsk.estimated_dev_effort + '</span>';
			l_sHtml += "</div>\n";
			l_sHtml += '&nbsp;<span>RAF: </span><div style="float: right; width: 30px;" id="task-raf-' + tsk.id + '" class="task-raf">' + tsk.remaining_estimated_effort + '</div></div>';
 			l_sHtml += "</div></div>\n";
		}
	}

	return l_sHtml;
}

function taskInPhase( tsk, phase ) {
	for( var i=0; i<aPhases.length; i++) {
		if( aPhases[i].id == phase && aPhases[i].resolutions ) {
			for( var j=0; j<aPhases[i].resolutions.length; j++) {
				if( tsk.resolution == aPhases[i].resolutions[j] ) {
					return true;
				}
			}
		}
	}

	return false;
}

function initEditable() {
	$("div.agile-sticker-body").dblclick( function () {
		if( $(this).children('textarea').length == 0 ) {
	    	var l_sDescription = $(this).html();
			$(this).html( '<textarea id="text_description" name="description" rows="11"></textarea>');

			$('#text_description').html( l_sDescription ).css('width', '98%').css('height', '95%');
			$('#text_description').keypress(function(e) {
				if( e.keyCode == 27 ) {
					// ESC == cancel
					$("div[id='description']").html( l_sDescription );
				}
			});
		}
	});	
	
	$("div.task-raf").dblclick( function () {
		if( $(this).children('input').length == 0 ) {
	    	var l_nRaf = $(this).html();
			$(this).html( '<input type="text" id="task-raf-editable" name="task-raf-editable" value="' +l_nRaf+ '">');

			$('#task-raf-editable').keypress(function(e) {
				if( e.keyCode == 27 ) {
					// ESC == cancel
					$("span[id='task-raf-editable']").html( l_nRaf );
				} else if( e.keyCode == 13 ) {
					// Enter == submit
					$(this).parent().html( $(this).val());
				}
			}).css('width', '30px').css('height', '15px').css('font-size', 9);
		}
	});
	
}

/*
	$( "#scrum-board" ).append(
		$( "#tmpl-scrum-user-story" ).render( aUserStories, { 'phases' : aPhases, 'showUserStories' : g_bShowUserStories } )
	);

	for(var i=0 ; i<aUserStories.length ; i++) {
		drawUserStory( aUserStories[i] );		
	}
*/

/*
<script id="tmpl-scrum-task" type="text/x-jsrender">
{{if phase == ~phase_id}}
            <div class="scrum-sticker-container">
				<div class="scrum-sticker scrum-sticker-task scrum-sticker-task-{{>~userStoryId}}" id="task-{{>id}}">
					<div class="scrum-sticker-header">
						<a href="#" title="Reference to GForge task in generic tracker">{{>id}}</a> : {{>title}}
					</div>
					<div class="scrum-sticker-body">
						{{>description}}
					</div>
					<div class="scrum-sticker-footer">
						<div id="task-progress-{{>id}}" style="height: 12px; width: 150px; background: #FFFF99; float: left;"><span style="position:absolute; margin-left:10px;">Cost: {{>estimated_dev_effort}}</span></div>&nbsp;<span>RAF: </span><div style="float: right; width: 30px;" id="task-raf-{{>id}}" class="task-raf">{{>remaining_estimated_effort}}</div>
					</div>
				</div>
			</div>
{{/if}}
</script>

<script id="tmpl-scrum-user-story-tasks" type="text/x-jsrender">
</script>

<script id="tmpl-scrum-user-story" type="text/x-jsrender">
	<tr class="scrum-user-story" valign="top">
        {{if ~showUserStories==true}}
		<td class="scrum-phase">
			<!-- div class="scrum-phase-body scrum-phase-body-{{>id}}" -->
			<div class="scrum-sticker-container">
				<div class="scrum-sticker scrum-sticker-user-story">
					<div class="scrum-sticker-header"{{if background!=null}} style="background: {{>background}};"{{/if}}>
						{{>title}}
					</div>
					<div class="scrum-sticker-body"{{if background}} style="background: {{>background}};"{{/if}}>
						{{>description}}
					</div>
					<div class="scrum-sticker-footer">
						<div id="user-story-progress-{{>id}}" style="height: 12px; width: 150px; background: #FFFF99; float: left;"><span style="position:absolute; margin-left:10px;"></div>&nbsp;<span>RAF : </span><span id="user-story-raf-{{>id}}"></span>
					</div>
				</div>
			</div>
			<!-- /div -->
		</td>
		{{/if}}
			
		{{for ~phases ~userStoryId=id}}
		{{if id!='phase-user-stories'}}
		<td id="{{>id}}-{{>~userStoryId}}" class="scrum-phase"{{if background!=null}} style="background: {{>background}};"{{/if}}>		
			<!-- div class="scrum-phase-body scrum-phase-body-{{>~userStoryId}}" id="{{>id}}-{{>~userStoryId}}" -->
			<!-- /div -->
		</td>	
		{{/if}}		
		{{/for}}

	</tr>
</script>

</head>
<body>
<div style="font-size: 14px; padding-bottom: 14px;">
	<div class="navigation">
	    <a href="index.html">Scrum board</a>&nbsp;|&nbsp;
		<a href="sprints.html">Sprints management</a>&nbsp;|&nbsp;
		<a href="indicators.html">Indicators</a>&nbsp;|&nbsp;
		<a href="admin.html">Administration</a>
	</div>
</div>
<div>
	<div class="navigation" style="float: left; width: 50%;">
		Sprint:
		<select>
			<option>V1.1.0</option>
			<option>V1.2.0</option>
			<option selected>V1.3.0</option>
		</select>
	</div>
	<div style="float: right; width: 40%; text-align: right;">
	Historize board for <input type="text" id="scrum-board-date">
	<button>Ok</button>
	</div>
</div>
<br/><br/>
<table id="scrum-board">
</table>
</body>
</html>

*/
