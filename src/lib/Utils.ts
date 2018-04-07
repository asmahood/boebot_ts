import { Timestamp } from "klasa";

const ts: Timestamp = new Timestamp("h:mm:ss");

export default class Util {
	/**
    * Split a string by its latest space character in a range from the character 0 to the selected one.
    * @param {string} str    The text to split.
    * @param {number} length The length of the desired string.
    * @returns {string}
    * @static
    */
	public static splitText(str: string, length: number) {
		const x = str.substring(0, length).lastIndexOf(" ");
		const pos = x === -1 ? length : x;
		return str.substring(0, pos);
	}

	/**
    * Show time duration in an un-trimmed h:mm:ss format.
    * @param {number} duration Duration in milliseconds.
    * @returns {string}
		* @static
    */
	public static showSeconds(duration: number) {
		return ts.display(duration);
	}

}
