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

$ret = array();

$ret['message'] = '';

$task_id = getStringFromRequest('task_id');
$target_phase_id = getStringFromRequest('target_phase_id');

$task = $taskboard->TrackersAdapter->getTask($task_id);
if( $task ) {
	// TODO drop task
} else {
	$ret['message'] = _('Task is not found. Reload taskboard, please.');
}
//$DropRule = taskboard_column_source_get_object( $target_phase_id );

echo json_encode( $ret );
