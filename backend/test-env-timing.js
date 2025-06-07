console.log('ENV AT MODULE LOAD:', process.env.PENTEST_TOOLS_API_KEY);
require('dotenv').config();
console.log('ENV AFTER DOTENV:', process.env.PENTEST_TOOLS_API_KEY);
