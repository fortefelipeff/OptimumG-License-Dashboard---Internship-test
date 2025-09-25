const addon = require('./build/Release/addon');

console.log('Hello from addon:', addon.hello());
console.log('Available licenses:', addon.listLicenses());

const trialKey = 'OPT-TRIAL-041';
console.log('Trial status before activation:', addon.licenseStatus(trialKey));
const activationSucceeded = addon.activate(trialKey, {
  machineId: 'DEV-RIG-01',
  activatedBy: 'cli-demo'
});
console.log('Activation succeeded?', activationSucceeded);
console.log('Trial status after activation:', addon.licenseStatus(trialKey));
console.log('Remaining days:', addon.remainingDays(trialKey));
