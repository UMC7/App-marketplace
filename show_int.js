const fs=require('fs');
const lines=fs.readFileSync('src/components/yachtOfferForm.constants.js','utf8').split('\n');
for(let i=584;i<=600;i++) console.log(i+1,lines[i]);
