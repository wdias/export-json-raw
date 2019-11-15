import { Request, Response } from "express";

import crypto from 'crypto';
import express from "express";
import compression from "compression";  // compresses requests
import expressValidator from "express-validator";
import bodyParser from "body-parser";
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { MetadataIds, metadataIdsDecoder, ValueType } from './types';
import util from './config/util';

const adapterMetadata = 'http://adapter-metadata.default.svc.cluster.local';
const clientMetadata: AxiosInstance = axios.create({
  baseURL: adapterMetadata,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
});
const adapterScalar = 'http://adapter-scalar.default.svc.cluster.local';
const clientScalar: AxiosInstance = axios.create({
  baseURL: adapterScalar,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
});
const adapterVector = 'http://adapter-vector.default.svc.cluster.local';
const clientVector: AxiosInstance = axios.create({
  baseURL: adapterVector,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
});

// Create Express server
const app = express();

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());

app.get('/export/json/raw/:timeseriesId', async (req: Request, res: Response) => {
  try {
    const timeseriesId: string = req.params.timeseriesId;
    console.log('timeseriesId: ', req.params.timeseriesId);
    const resp: AxiosResponse = await clientMetadata.get(`/timeseries/${timeseriesId}`);
    const metadataIds: MetadataIds = metadataIdsDecoder.runWithException(resp.data);
    const requestId: string = crypto.randomBytes(16).toString('hex');
    if (metadataIds.valueType === ValueType.Scalar || metadataIds.valueType === ValueType.Vector) {
      const start: string = req.query.start;
      const end: string = req.query.end;
      const q: string = `requestId=${requestId}${util.queryParam('start', start)}${util.queryParam('end', end)}`
      const result: AxiosResponse = (metadataIds.valueType === ValueType.Scalar) ?
        await clientScalar.get(`timeseries/${timeseriesId}?${q}`) :
        await clientVector.get(`timeseries/${timeseriesId}?${q}`);
      res.status(result.status).send(result.data);
    } else {
      res.status(400).send(`Unknown Value Type: ${metadataIds.valueType}`);
    }
  } catch (e) {
    res.status(500).send(e.toString());
  }
});

app.get('/export/json/raw/public/hc', (req: Request, res: Response) => {
  console.log('Import Health Check 1');
  res.send('OK');
});

export default app;
