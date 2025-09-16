// Stockage en mémoire
const submissions = {};

function createSubmission(id, data) {
  submissions[id] = data;
}

function getSubmission(id) {
  return submissions[id];
}

function updateSubmission(id, patch) {
  if(!submissions[id]) return null;
  submissions[id] = { ...submissions[id], ...patch };
  return submissions[id];
}

module.exports = { 
    submissions, 
    createSubmission, 
    getSubmission, 
    updateSubmission 
};
