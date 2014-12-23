<?php

/*
 * Copyright (C) 2013 Vitaliy Pylypiv <vitaliy.pylypiv@gmail.com>
 *
 * This file is part of FusionForge.
 *
 * FusionForge is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published
 * by the Free Software Foundation; either version 2 of the License,
 * or (at your option) any later version.
 *
 * FusionForge is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

require_once dirname(__FILE__)."/../../env.inc.php";
require_once $gfcommon.'include/pre.php';
require_once $gfconfig.'plugins/taskboard/config.php' ;

global $gfplugins;
require_once $gfplugins.'taskboard/www/include/TaskBoardHtml.class.php';


$user = session_get_user(); // get the session user

if (!$user || !is_object($user) ) {
	exit_error(_('Invalid User'),'home');
} else if ( $user->isError() ) {
	exit_error($user->getErrorMessage(),'home');
} else if ( !$user->isActive()) {
	exit_error(_('Invalid User : Not active'),'home');
}


$pluginname = 'taskboard';
$group_id = getStringFromRequest('group_id');

if (!$group_id) {
	exit_error(_('Cannot Process your request : No ID specified'),'home');
} else {
	$group = group_get_object($group_id);
	if ( !$group) {
		exit_no_group();
	}
	if ( ! ($group->usesPlugin ( $pluginname )) ) {//check if the group has the plugin active
		exit_error(sprintf(_('First activate the %s plugin through the Project\'s Admin Interface'),$pluginname),'home');
	}


	$taskboard = new TaskBoardHtml( $group ) ;
	$taskboard->header(
		array(
			'title'=>'Taskboard for '.$group->getPublicName(),
			'pagename'=>"Taskboard",
			'sectionvals'=>array(group_getname($group_id)),
			'group' => $group_id
		)
	);


        if( $taskboard->isError() ) {
		exit_error($taskboard->getErrorMessage());
	} else {
		$columns = $taskboard->getColumns();
		$user_stories_tracker = $taskboard->getUserStoriesTrackerID();
		$columns_number = count($columns) + ( $user_stories_tracker ? 1 : 0 );
		$column_width = intval( 100 / $columns_number );
?>

<div id="messages" class="warning" style="display: none;"></div>
<br/>

<link rel="stylesheet" type="text/css" href="/plugins/taskboard/css/agile-board.css">
<script type="text/javascript" src="/plugins/taskboard/js/agile-board.js?<?= time() ?>"></script>
<?php if ( function_exists( 'html_use_jqueryui' ) ) { html_use_jqueryui(); } else { ?>
<script type="text/javascript" src="/plugins/taskboard/js/jquery-ui.js"></script>
<?php } ?>

<?php
$techs = $group->getUsers();

$_assigned_to = getIntFromRequest('_assigned_to','0');
// stolen code from tracker
$tech_id_arr = array () ;
$tech_name_arr = array () ;

foreach ($techs as $tech) {
        $tech_id_arr[] = $tech->getID() ;
        $tech_name_arr[] = $tech->getRealName() ;
}
$tech_id_arr[]='0';  //this will be the 'any' row
$tech_name_arr[]=_('Any');

if (is_array($_assigned_to)) {
        $_assigned_to='';
}
$tech_box=html_build_select_box_from_arrays ($tech_id_arr,$tech_name_arr,'_assigned_to',$_assigned_to,true,_('Unassigned'));
// end of the stolen code

?>


<div class="tabbertab'.($af->query_type == 'custom' ? ' tabbertabdefault' : '').'" title="'._('Simple Filtering and Sorting').'">
        <form action="'. getStringFromServer('PHP_SELF') .'?group_id='.$group_id.'&amp;atid='.$ath->getID().'" method="post">
        <table width="100%" cellspacing="0">
        <tr>
        <td>
        <?php echo _('Assignee').':&nbsp;'. $tech_box ; ?>
        </td>
        </tr>
        </table>
        </form>
</div>

<table id="agile-board">
	<thead>
		<tr valign="top">

		<?php if( $user_stories_tracker ) { ?>
			<td class="agile-phase-title" style="width: <?= $column_width ?>%;"><?=  _('User stories')?></td>
		<?php } ?>

		<?php foreach( $columns as $column ) { ?>
		<?php 	
			$style='width: ' . $column_width . '%;'; 
			$title_bg_color =  $column->getTitleBackgroundColor();
			if( $title_bg_color ) {
				$style .= 'background-color: ' . $title_bg_color . ';';
			}
		?>
			<td class="agile-phase-title" style="<?= $style ?>"><?= $column->getTitle() ?></td>
		<?php } ?>
		</tr>
	</thead>
	<tbody>
	</tbody>
</table>

<script>
var gGroupId = <?= $group_id ?>;
bShowUserStories = <?= $taskboard->getUserStoriesTrackerID() ? 'true' : 'false' ?>;
aUserStories = [];
aPhases = []

jQuery( document ).ready(function( $ ) {
	loadTaskboard( <?= $group_id ?> );

	jQuery('select[name="_assigned_to"]').change(function () {
		loadTaskboard( <?= $group_id ?> );
	});
});
</script>
<?php
	}
}

site_project_footer(array());

?>
