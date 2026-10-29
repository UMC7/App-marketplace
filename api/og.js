// api/og.js
// Una sola función para las vistas previas al compartir (límite de 12 funciones en Vercel Hobby).
// vercel.json reescribe /api/event-og, /api/job-og y /api/service-og hacia aquí con ?type=.

const eventOg = require('./_lib/og/event.js');
const jobOg = require('./_lib/og/job.js');
const serviceOg = require('./_lib/og/service.js');

const HANDLERS = { event: eventOg, job: jobOg, service: serviceOg };

module.exports = async (req, res) => {
  const query = req.query || {};
  let type = String(query.type || '').toLowerCase();
  if (!HANDLERS[type]) {
    if (query.offer) type = 'job';
    else if (query.service) type = 'service';
    else type = 'event';
  }
  return HANDLERS[type](req, res);
};
