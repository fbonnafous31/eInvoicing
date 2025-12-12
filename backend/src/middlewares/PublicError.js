// backend/src/utils/PublicError.js
class PublicError extends Error {
  constructor(publicMessage, status = 400) {
    super(publicMessage); // message interne
    this.publicMessage = publicMessage; // message exposé au front
    this.status = status;
  }
}

module.exports = PublicError;
