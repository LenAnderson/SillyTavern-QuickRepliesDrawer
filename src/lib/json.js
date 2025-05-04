/**
 * Attempts to parse and format the provided text as JSON.
 * @param {string} text A valid JSON string or any other string.
 * @param {(this:any, key:string, value:any)=>any} replacer A function that transforms the results.
 * @param {string|number} space Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read.
 * @returns A formatted JSON string, or the original text if not valid JSON.
 */
export const tryParseAndFormat = (text, replacer = null, space = 4)=>{
    try {
        const parsed = JSON.parse(text);
        return JSON.stringify(parsed, replacer, space);
    } catch {
        return text;
    }
};

/**
 * Attempts to parse the provided text as JSON.
 * @param {string} text A valid JSON string.
 * @returns {any|null} The resulting object or null if not valid JSON.
 */
export const tryParse = (text)=>{
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
};
