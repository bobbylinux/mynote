//ensureAuthenticated
module.exports = {
  accessoSicuro: (request, response, next) => {
    if (request.isAuthenticated()) {
      return next();
    }
    request.flash("msg_errore", "non puoi entrare, mi dispiace");
    response.redirect('/login');
  }
};
