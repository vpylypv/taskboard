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

global $gfcommon;
require_once $gfcommon.'tracker/ArtifactType.class.php';
require_once $gfcommon.'tracker/ArtifactTypeFactory.class.php';
require_once $gfcommon.'tracker/ArtifactFactory.class.php';
require_once $gfcommon.'tracker/ArtifactExtraField.class.php';

class TaskBoardBasicAdapter {
        /**
         * The TaskBoard object.
         *
         * @var         object  $TaskBoard.
         */
        var $TaskBoard; //taskboard object

	var $_atf=NULL; // artifact trackers factory
	var $_ust=NULL; // user stories tracker
	var $_tt=array(); // tasks trackers
	var $_fields=array();
	var $_res=array(); // hash os resolution values element_id => element_name

	function TaskBoardBasicAdapter($TaskBoard) {
                $this->TaskBoard = $TaskBoard;
	}


	/**
         * TODO - filters
         */
        function getArtifactTypeFactory() {
		if( !$this->_atf ) {
			$this->_atf = new ArtifactTypeFactory($this->TaskBoard->Group); 
		}

		return $this->_atf;
        }

	function getUserStoriesTracker() {
		if( !$this->_ust ) {
                        $this->_ust = new ArtifactType($this->TaskBoard->Group, $this->TaskBoard->getUserStoriesTrackerID() );
                }

                return $this->_ust;
	}

	function getTasksTracker($tracker_id) {
                if( !array_key_exists($tracker_id, $this->_tt) ) {
                        $this->_tt[$tracker_id] = new ArtifactType($this->TaskBoard->Group, $tracker_id );
                }

                return $this->_tt[$tracker_id];
        }

	/**
	 * TODO - filters
	 */
	function getUserStories() {
		$at = $this->getUserStoriesTracker();
		$af = new ArtifactFactory($at);
		if (!$af || !is_object($af)) {
		        exit_error('Error','Could Not Get Factory');
		} elseif ($af->isError()) {
        		exit_error('Error',$af->getErrorMessage());
		}

		$_status = 1;
		$af->setup(NULL,NULL,NULL,NULL,NULL,NULL,$_status,NULL);

		return $af->getArtifacts();
	}

	/**
 	 *
	 */
	function getFieldsIds($tracker_id) {
		$ret = array(
			'resolution' => 0,
			'estimated_dev_effort' => 0,
			'remaining_estimated_effort' => 0,
			'release' => 0,
			'user_story' => 0
		);

		if( !array_key_exists($tracker_id, $this->_fields) ) {
                        $at = $this->getTasksTracker($tracker_id);

			$extra_fields = $at->getExtraFields();
			foreach($extra_fields as $f) {
			//	if( array_key_exists( $f['alias'], $ret ) ) {
					$ret[ $f['alias'] ] = $f['extra_field_id'];
			//	}
			}					
			$this->_fields[$tracker_id] = $ret;
                }

		return $this->_fields[$tracker_id];
	}

	/**
         *
         */
        function getResolutionValues($tracker_id) {
                $ret = array();

                if( !array_key_exists($tracker_id, $this->_res) ) {
                        $at = $this->getTasksTracker($tracker_id);

                        $extra_fields = $at->getExtraFields();
                        foreach($extra_fields as $f) {
                                if( $f['alias'] == 'resolution' ) {
					$ef = new ArtifactExtraField($at, $f);
					foreach( $ef->getAvailableValues() as $v) {
						$ret[ $v['element_name'] ] = $v['element_id'];
					}
					$this->_res[$tracker_id] = $ret;
                                }
                        }
                }

                return array_keys( $this->_res[$tracker_id] );
        }

	/**
	 *
	 */
	function getTasks($tracker_id,$filter=NULL) {
		$tasks = array();

		$at = $this->getTasksTracker($tracker_id);
		if( $at ) {
			$af = new ArtifactFactory($at);
	                if (!$af || !is_object($af)) {
        	                exit_error('Error','Could Not Get Factory');
                	} elseif ($af->isError()) {
                        	exit_error('Error',$af->getErrorMessage());
                	}

	                $_status = 1;
        	        $af->setup(NULL,NULL,NULL,NULL,NULL,NULL,$_status,NULL);

                	$tasks = $af->getArtifacts();
		}
		
		return $tasks;
	}

	/**
         *
         */
        function getTask( $task_id ) {
                return artifact_get_object( $task_id );
	}

	/**
         *
         */
        function updateTask(&$artifact, $assigned_to, $resolution, $title=NULL, $description=NULL ) {

		if( !$assigned_to ) {
			$assigned_to = $artifact->getAssignedTo();
		}

		$tracker_id = $artifact->ArtifactType->getID();
		$extra_fields = $artifact->getExtraFieldData();

                if( !array_key_exists($tracker_id, $this->_res) ) {
                        $this->getResolutionValues($tracker_id);
                }

                $fields_ids = $this->getFieldsIds( $tracker_id );

                if( array_key_exists( 'resolution', $fields_ids ) ) {
                        $resolution_field_id = $fields_ids['resolution'];

			if( array_key_exists( $resolution, $this->_res[$tracker_id] ) ){
				$extra_fields[ $resolution_field_id ] = $this->_res[$tracker_id][$resolution]; 
			}
                }

		if( !$title ) {
			$title = htmlspecialchars_decode( $artifact->getSummary() );
		}

		if( !$description ) {
			$description = htmlspecialchars_decode( $artifact->getDetails() );
		}

		$ret = $artifact->update(
			$artifact->getPriority(),
			$artifact->getStatusId(),
                	$assigned_to,
			$title,
			100,
			'',
			$tracker_id,
                	$extra_fields,
			$description
			);

		if( !$ret ) {
			return $artifact->getErrorMessage();
		}

		return '';
	}
}
// Local Variables:
// mode: php
// c-file-style: "bsd"
// End:

?>
