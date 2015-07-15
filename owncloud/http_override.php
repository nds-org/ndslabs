<?php

/**
* ownCloud
*
* @author Frank Karlitschek
* @copyright 2012 Robin Appelman icewind@owncloud.com
*
* Modified by Matthew Turk to allow for URL passing.
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
* License as published by the Free Software Foundation; either
* version 3 of the License, or any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU AFFERO GENERAL PUBLIC LICENSE for more details.
*
* You should have received a copy of the GNU Affero General Public
* License along with this library.  If not, see <http://www.gnu.org/licenses/>.
*
*/

/**
 * user backend using http auth requests
 */
class OC_User_HTTP extends OC_User_Backend {
	/**
	 * Check if the password is correct
	 * @param string $uid The username
	 * @param string $password The password
	 * @return string
	 *
	 * Check if the password is correct without logging in the user
	 * returns the user id or false
	 */
	public function checkPassword($uid, $password) {
        $url = OC_Config::getValue( "irodsresturl", "");
		$ch = curl_init();
        $user = substr($uid, 4);
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_USERPWD, $user.':'.$password);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

		curl_exec($ch);

		$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);

		curl_close($ch);

		if($status === 200) {
			return $uid;
		}

		return false;
	}

	/**
	 * check if a user exists
	 * @param string $uid the username
	 * @return boolean
	 */
	public function userExists($uid) {
        if (strpos($uid,'NDS#') === 0) {
            return true;
        }
		return false;
	}

	/**
	* get the user's home directory
	* @param string $uid the username
	* @return string|false
	*/
	public function getHome($uid) {
		if($this->userExists($uid)) {
            $user = substr($uid, 4);
			return OC_Config::getValue( "datadirectory", OC::$SERVERROOT."/data" ) . '/' . $user;
		}else{
			return false;
		}
	}
}
