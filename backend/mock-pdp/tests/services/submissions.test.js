/* global describe, it, expect, beforeEach */

// tests/services/submissions.test.js
const {
  submissions,
  createSubmission,
  getSubmission,
  updateSubmission
} = require('../../services/submissions');

describe('Submissions Service', () => {

  beforeEach(() => {
    // réinitialise le stockage avant chaque test
    for (const key in submissions) delete submissions[key];
  });

  it('createSubmission ajoute une nouvelle submission', () => {
    createSubmission('1', { invoice: 100 });
    expect(submissions['1']).toEqual({ invoice: 100 });
  });

  it('getSubmission retourne la submission existante', () => {
    createSubmission('2', { invoice: 200 });
    const result = getSubmission('2');
    expect(result).toEqual({ invoice: 200 });
  });

  it('getSubmission retourne undefined pour un id inexistant', () => {
    const result = getSubmission('999');
    expect(result).toBeUndefined();
  });

  it('updateSubmission modifie une submission existante', () => {
    createSubmission('3', { invoice: 300, status: 'pending' });
    const result = updateSubmission('3', { status: 'processed' });
    expect(result).toEqual({ invoice: 300, status: 'processed' });
    expect(submissions['3']).toEqual({ invoice: 300, status: 'processed' });
  });

  it('updateSubmission retourne null si la submission n\'existe pas', () => {
    const result = updateSubmission('999', { status: 'processed' });
    expect(result).toBeNull();
  });

});
