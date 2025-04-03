/**
 * THIS FILE IS DEPRECATED
 * Please use /src/utils/dbConnect.js instead
 * 
 * This file is kept for backwards compatibility and to prevent breaking changes.
 * It forwards all requests to the centralized utils/dbConnect.js module.
 */

import connectToDB from '../utils/dbConnect.js';

// Export the connection function from utils/dbConnect.js
export default connectToDB;