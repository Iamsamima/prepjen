const ts = () => new Date().toISOString();
module.exports = {
  info: (...a) => console.log(`[INFO ${ts()}]`, ...a),
  warn: (...a) => console.warn(`[WARN ${ts()}]`, ...a),
  error: (...a) => console.error(`[ERR  ${ts()}]`, ...a),
  debug: (...a) => process.env.NODE_ENV !== 'production' && console.log(`[DBG  ${ts()}]`, ...a),
};