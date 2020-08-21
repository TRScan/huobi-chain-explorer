import { RequestHandler } from 'express';

export function allowOptions(): RequestHandler {
  return (req, res, next) => req.method === 'OPTIONS' ? res.sendStatus(200) : next();
}